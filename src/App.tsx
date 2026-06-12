import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Check,
  Download,
  Gauge,
  History,
  Menu,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Stethoscope,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BuildGuide } from "./components/BuildGuide";
import { BUILD_GUIDE_VERSION } from "./build-guide/engine";
import { Modal } from "./components/Modal";
import { Field, Segmented } from "./components/Field";
import { ProgressRail } from "./components/ProgressRail";
import { TuneSections } from "./components/TuneSections";
import { loadCars } from "./data/cars";
import {
  ALL_CAPABILITIES,
  DEFAULT_INPUT,
  ENGINE_VERSION,
  TUNE_MODES,
} from "./domain/defaults";
import { SEASONS } from "./domain/seasons";
import { classForPi, FH6_MAX_PI } from "./domain/pi";
import packageJson from "../package.json";
import type {
  Capability,
  AssistPreset,
  CarRecord,
  DiagnosisId,
  DriveType,
  InputDevice,
  InputMode,
  TestRunContext,
  TuneInput,
  TuneResult,
  UnitSystem,
} from "./domain/types";
import { applyDiagnosis, DIAGNOSES } from "./engine/diagnosis";
import { calculateImproved } from "./engine/improved";
import {
  loadSpringSliderRange,
  saveSpringSliderRange,
} from "./storage/carOverrides";
import {
  deleteTune,
  exportGarage,
  exportTune,
  importTunes,
  loadSavedTunes,
  saveTune,
  tuneHistoryFor,
  tuneAsText,
} from "./storage/tunes";

const compounds = [
  "Street",
  "Sport",
  "Race Semi-Slick",
  "Race Slick",
  "Rally",
  "Off-Road",
  "Drift",
  "Snow",
  "Drag",
];

const capabilityLabels: Record<Capability, string> = {
  tires: "Bandenspanning",
  gearing: "Overbrenging",
  alignment: "Uitlijning",
  arb: "Stabilisatorstangen",
  springs: "Veren & rijhoogte",
  damping: "Demping",
  aero: "Aero",
  brakes: "Remmen",
  differential: "Differentieel",
};

const buildFocusLabels = {
  balanced: "Balans",
  grip: "Grip",
  acceleration: "Acceleratie",
  speed: "Topsnelheid",
  control: "Controle",
} as const;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const convertInputUnits = (input: TuneInput, next: UnitSystem): TuneInput => {
  if (input.unitSystem === next) return input;
  return {
    ...input,
    unitSystem: next,
    weight:
      next === "metric"
        ? Math.round(input.weight / 2.205)
        : Math.round(input.weight * 2.205),
    maxTorque:
      next === "metric"
        ? Math.round(input.maxTorque * 1.356)
        : Math.round(input.maxTorque / 1.356),
    topSpeed:
      next === "metric"
        ? Math.round(input.topSpeed * 1.609)
        : Math.round(input.topSpeed / 1.609),
  };
};

function App() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<TuneInput>(() => ({
    ...DEFAULT_INPUT,
    capabilities: { ...ALL_CAPABILITIES },
    springSliderRange: loadSpringSliderRange(
      DEFAULT_INPUT.year,
      DEFAULT_INPUT.make,
      DEFAULT_INPUT.model,
    ),
  }));
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [carSearch, setCarSearch] = useState("Mazda RX-7");
  const [buildMode, setBuildMode] = useState<"guide" | "manual">("guide");
  const [result, setResult] = useState<TuneResult | null>(null);
  const [saved, setSaved] = useState<TuneResult[]>(loadSavedTunes);
  const [modal, setModal] = useState<
    "diagnosis" | "garage" | "history" | "menu" | null
  >(null);
  const [testRunDraft, setTestRunDraft] = useState<
    Omit<TestRunContext, "observedAt">
  >({
    location: "",
    cleanLaps: 3,
    inputDevice: "Controller",
    assists: "ABS",
    notes: "",
  });
  const [notice, setNotice] = useState("");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCars().then(setCars).catch((error: Error) => setNotice(error.message));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const clearInstallPrompt = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);

  const matches = useMemo(() => {
    const query = carSearch.toLowerCase().trim();
    if (!query) return cars.slice(0, 20);
    return cars
      .filter((car) =>
        `${car.year} ${car.make} ${car.model}`.toLowerCase().includes(query),
      )
      .slice(0, 20);
  }, [carSearch, cars]);

  const patch = <K extends keyof TuneInput>(key: K, value: TuneInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  const patchSpringRange = (
    key: "frontMin" | "frontMax" | "rearMin" | "rearMax",
    rawValue: string,
  ) => {
    const springSliderRange = {
      unit:
        input.springSliderRange?.unit ??
        (input.unitSystem === "metric" ? ("kgf/mm" as const) : ("lb/in" as const)),
      ...input.springSliderRange,
      [key]: rawValue === "" ? undefined : Number(rawValue),
    };
    saveSpringSliderRange(input.year, input.make, input.model, springSliderRange);
    patch("springSliderRange", springSliderRange);
  };

  const selectCar = (car: CarRecord) => {
    const weightKg =
      car.weight > 0
        ? car.weightUnit === "kg"
          ? car.weight
          : car.weight / 2.205
        : 0;
    setInput((current) => ({
      ...current,
      make: car.make,
      model: car.model,
      year: car.year,
      driveType: car.drive ?? current.driveType,
      carClass: car.cls || current.carClass,
      pi: car.pi || current.pi,
      weight:
        weightKg > 0
          ? current.unitSystem === "metric"
            ? Math.round(weightKg)
            : Math.round(weightKg * 2.205)
          : current.weight,
      frontWeightPercent: car.frontWeight || current.frontWeightPercent,
      ev: car.ev,
      hasAero: false,
      includeGearing: true,
      capabilities: { ...ALL_CAPABILITIES },
      springSliderRange: loadSpringSliderRange(car.year, car.make, car.model),
      buildGuide: undefined,
    }));
    setCarSearch(`${car.year} ${car.make} ${car.model}`);
    setBuildMode("guide");
    setStep(1);
  };

  const generate = () => {
    const finalInput = {
      ...input,
      maxTorque: input.inputMode === "quick" ? (input.unitSystem === "metric" ? 500 : 369) : input.maxTorque,
      topSpeed: input.inputMode === "quick" ? (input.unitSystem === "metric" ? 240 : 149) : input.topSpeed,
      gears: input.inputMode === "quick" ? (input.ev ? 1 : 6) : input.gears,
      includeGearing:
        !input.ev &&
        input.inputMode === "advanced" &&
        input.includeGearing &&
        input.capabilities.gearing !== "none",
    };
    setResult(calculateImproved(finalInput));
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCurrent = () => {
    if (!result) return;
    setSaved(saveTune(result));
    setNotice("Tune lokaal opgeslagen");
  };

  const shareCurrent = async () => {
    if (!result) return;
    const text = tuneAsText(result);
    if (navigator.share) {
      await navigator.share({
        title: `${result.input.make} ${result.input.model} tune`,
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      setNotice("Tune naar klembord gekopieerd");
    }
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setNotice("App wordt geïnstalleerd");
    }
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const next = importTunes(await file.text());
      setSaved(next);
      setNotice(`${next.length} tunes beschikbaar`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import mislukt");
    }
  };

  const applyFeedback = (id: DiagnosisId) => {
    if (!result) return;
    if (!testRunDraft.location.trim()) {
      setNotice("Vul eerst de testlocatie in");
      return;
    }
    const revised = applyDiagnosis(result, id, testRunDraft);
    saveTune(result);
    setResult(revised);
    setSaved(saveTune(revised));
    setTestRunDraft((current) => ({ ...current, notes: "" }));
    setModal(null);
    setNotice("Bijstelling als nieuwe revisie opgeslagen");
  };

  const tuneHistory = useMemo(
    () => (result ? tuneHistoryFor(saved, result) : []),
    [result, saved],
  );

  const loadTune = (item: TuneResult) => {
    const springSliderRange =
      item.input.springSliderRange ??
      loadSpringSliderRange(
        item.input.year,
        item.input.make,
        item.input.model,
    );
    setInput({ ...item.input, springSliderRange });
    setResult(item);
    setStep(3);
    setModal(null);
  };

  return (
    <div className="app-shell">
      {notice ? <div className="toast">{notice}</div> : null}
      <header className="app-header">
        <button
          type="button"
          className="icon-button"
          aria-label={step > 0 ? "Vorige stap" : "Menu openen"}
          onClick={() => (step > 0 ? setStep(step - 1) : setModal("menu"))}
        >
          {step > 0 ? <ArrowLeft /> : <Menu />}
        </button>
        <div className="app-header__title">
          <span>
            {step === 3
              ? "Resultaat"
              : step === 1 && buildMode === "guide"
                ? "Build Guide"
                : "Tune Companion"}
          </span>
          {step === 3 || (step === 1 && buildMode === "guide") ? (
            <small>
              {input.year} {input.make} {input.model}
            </small>
          ) : (
            <small>Offline · build-aware · persoonlijk</small>
          )}
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Garage openen"
          onClick={() => setModal("garage")}
        >
          <Bookmark />
          {saved.length ? <i>{saved.length}</i> : null}
        </button>
      </header>

      <ProgressRail step={step} onStep={setStep} />

      <main>
        {step === 0 ? (
          <section className="screen">
            <div className="screen-heading">
              <span>01</span>
              <div>
                <h1>Kies je auto</h1>
                <p>Zoek op merk, model of bouwjaar.</p>
              </div>
            </div>
            <Field label="Autodatabase">
              <input
                className="text-input text-input--large"
                value={carSearch}
                onChange={(event) => setCarSearch(event.target.value)}
                placeholder="Bijv. Mazda RX-7"
              />
            </Field>
            <div className="car-results">
              {matches.map((car) => (
                <button
                  type="button"
                  className="car-row"
                  key={`${car.year}-${car.make}-${car.model}`}
                  onClick={() => selectCar(car)}
                >
                  <span>
                    <strong>{car.make}</strong>
                    {car.model}
                  </span>
                  <span className="car-row__meta">
                    <em>{car.year}</em>
                    <b>{car.cls || "?"}</b>
                    <small>
                      {car.drive ??
                        (car.dataStatus !== "technical"
                          ? "Check in-game"
                          : "?")}
                    </small>
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="secondary-action"
              onClick={() => {
                setBuildMode("manual");
                setStep(1);
              }}
            >
              Handmatig invoeren
            </button>
          </section>
        ) : null}

        {step === 1 && buildMode === "guide" ? (
          <BuildGuide
            input={input}
            onManual={() => setBuildMode("manual")}
            onApply={(nextInput, continueToGoal) => {
              setInput(nextInput);
              setNotice("Buildplan toegepast · controleer de echte waarden in FH6");
              if (continueToGoal) {
                setStep(2);
              } else {
                setBuildMode("manual");
              }
            }}
          />
        ) : null}

        {step === 1 && buildMode === "manual" ? (
          <section className="screen">
            <div className="selected-car">
              <span>
                {input.year} {input.make}
              </span>
              <strong>{input.model}</strong>
              <div>
                <b>{input.carClass}</b>
                <em>{input.pi}</em>
                <small>{input.driveType}</small>
              </div>
            </div>

            <div className="screen-heading">
              <span>02</span>
              <div>
                <h1>Beschrijf je build</h1>
                <p>
                  Controleer de uiteindelijke waarden uit FH6. We tonen alleen
                  instellingen die je echt kunt aanpassen.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="guide-return"
              onClick={() => setBuildMode("guide")}
            >
              <SlidersHorizontal size={18} />
              Terug naar Build Guide
            </button>

            <Segmented<UnitSystem>
              label="Eenheden"
              value={input.unitSystem}
              options={[
                { value: "metric", label: "Metrisch" },
                { value: "imperial", label: "Imperial" },
              ]}
              onChange={(value) => setInput((current) => convertInputUnits(current, value))}
            />
            <Segmented<InputMode>
              label="Invoer"
              value={input.inputMode}
              options={[
                { value: "quick", label: "Quick" },
                { value: "advanced", label: "Advanced" },
              ]}
              onChange={(value) => patch("inputMode", value)}
            />
            <div className="field-grid">
              <Field label={`Gewicht (${input.unitSystem === "metric" ? "kg" : "lb"})`}>
                <input
                  type="number"
                  value={input.weight || ""}
                  onChange={(event) => patch("weight", Number(event.target.value))}
                />
              </Field>
              <Field label="Gewicht voor (%)">
                <input
                  type="number"
                  min="30"
                  max="70"
                  value={input.frontWeightPercent}
                  onChange={(event) =>
                    patch("frontWeightPercent", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="PI">
                <input
                  type="number"
                  min="100"
                  max={FH6_MAX_PI}
                  value={input.pi}
                  onChange={(event) => {
                    const pi = Number(event.target.value);
                    setInput((current) => ({
                      ...current,
                      pi,
                      carClass: classForPi(pi),
                    }));
                  }}
                />
              </Field>
              <Field label="Aandrijving">
                <select
                  value={input.driveType}
                  onChange={(event) => patch("driveType", event.target.value as DriveType)}
                >
                  <option>FWD</option>
                  <option>RWD</option>
                  <option>AWD</option>
                </select>
              </Field>
            </div>

            {input.buildGuide ? (
              <label className="build-verification">
                <input
                  type="checkbox"
                  checked={input.buildGuide.valuesConfirmed}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      buildGuide: current.buildGuide
                        ? {
                            ...current.buildGuide,
                            valuesConfirmed: event.target.checked,
                          }
                        : undefined,
                    }))
                  }
                />
                <span>
                  <strong>Buildwaarden gecontroleerd in FH6</strong>
                  PI, gewicht, gewichtsverdeling, aandrijving en gemonteerde
                  onderdelen kloppen met de game.
                </span>
              </label>
            ) : null}

            <div className="spring-range-panel">
              <div className="spring-range-panel__heading">
                <div>
                  <h2 className="subheading">Veer-slidergrenzen</h2>
                  <p>
                    Neem minimum en maximum letterlijk over uit FH6. We bewaren
                    deze waarden voor deze auto.
                  </p>
                </div>
                <span>
                  {input.springSliderRange?.unit ??
                    (input.unitSystem === "metric" ? "kgf/mm" : "lb/in")}
                </span>
              </div>
              <div className="field-grid">
                <Field label="Voor minimum">
                  <input
                    type="number"
                    step="0.01"
                    value={input.springSliderRange?.frontMin ?? ""}
                    onChange={(event) =>
                      patchSpringRange("frontMin", event.target.value)
                    }
                  />
                </Field>
                <Field label="Voor maximum">
                  <input
                    type="number"
                    step="0.01"
                    value={input.springSliderRange?.frontMax ?? ""}
                    onChange={(event) =>
                      patchSpringRange("frontMax", event.target.value)
                    }
                  />
                </Field>
                <Field label="Achter minimum">
                  <input
                    type="number"
                    step="0.01"
                    value={input.springSliderRange?.rearMin ?? ""}
                    onChange={(event) =>
                      patchSpringRange("rearMin", event.target.value)
                    }
                  />
                </Field>
                <Field label="Achter maximum">
                  <input
                    type="number"
                    step="0.01"
                    value={input.springSliderRange?.rearMax ?? ""}
                    onChange={(event) =>
                      patchSpringRange("rearMax", event.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <h2 className="subheading">Verstelbare onderdelen</h2>
            <div className="capability-list">
              {(Object.keys(capabilityLabels) as Capability[]).map((capability) => {
                if (capability === "gearing") {
                  return (
                    <label className="capability-row" key={capability}>
                      <span>{capabilityLabels[capability]}</span>
                      <select
                        value={input.capabilities.gearing}
                        onChange={(event) =>
                          setInput((current) => ({
                            ...current,
                            capabilities: {
                              ...current.capabilities,
                              gearing: event.target.value as "none" | "final" | "full",
                            },
                          }))
                        }
                      >
                        <option value="none">Niet verstelbaar</option>
                        <option value="final">Alleen eindoverbrenging</option>
                        <option value="full">Volledig</option>
                      </select>
                    </label>
                  );
                }
                if (capability === "differential") {
                  return (
                    <label className="capability-row" key={capability}>
                      <span>{capabilityLabels[capability]}</span>
                      <select
                        value={
                          input.capabilities.differential === true
                            ? "full"
                            : input.capabilities.differential === false
                              ? "none"
                              : input.capabilities.differential
                        }
                        onChange={(event) =>
                          setInput((current) => ({
                            ...current,
                            capabilities: {
                              ...current.capabilities,
                              differential: event.target.value as
                                | "none"
                                | "accel"
                                | "full",
                            },
                          }))
                        }
                      >
                        <option value="none">Niet verstelbaar</option>
                        <option value="accel">Alleen acceleratie</option>
                        <option value="full">Volledig</option>
                      </select>
                    </label>
                  );
                }
                return (
                  <label className="capability-row" key={capability}>
                    <span>{capabilityLabels[capability]}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(input.capabilities[capability])}
                      onChange={(event) =>
                        setInput((current) => ({
                          ...current,
                          capabilities: {
                            ...current.capabilities,
                            [capability]: event.target.checked,
                          },
                          hasAero:
                            capability === "aero"
                              ? event.target.checked
                              : current.hasAero,
                        }))
                      }
                    />
                  </label>
                );
              })}
            </div>
            <button type="button" className="primary-action" onClick={() => setStep(2)}>
              Verder naar doel
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="screen">
            <div className="screen-heading">
              <span>03</span>
              <div>
                <h1>Kies het doel</h1>
                <p>Modus, ondergrond en rijgevoel sturen het advies.</p>
              </div>
            </div>
            <div className="mode-grid">
              {TUNE_MODES.map((mode) => (
                <button
                  type="button"
                  key={mode.id}
                  className={input.tuneMode === mode.id ? "is-active" : ""}
                  onClick={() => {
                    const surface =
                      mode.id === "Rally" ? "Mixed" : mode.id === "Rain" ? "Road" : "Road";
                    const compound =
                      mode.id === "Rally"
                        ? "Rally"
                        : mode.id === "Drag"
                          ? "Drag"
                          : mode.id === "Drift"
                            ? "Drift"
                            : "Race Semi-Slick";
                    setInput((current) => ({
                      ...current,
                      tuneMode: mode.id,
                      surface,
                      tireCompound: compound,
                    }));
                  }}
                >
                  <strong>{mode.label}</strong>
                  <span>{mode.sub}</span>
                </button>
              ))}
            </div>
            <div className="field-grid">
              <Field label="Seizoen">
                <select
                  value={input.season ?? "Summer"}
                  onChange={(event) =>
                    patch("season", event.target.value as TuneInput["season"])
                  }
                >
                  {SEASONS.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.id}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ondergrond">
                <select
                  value={input.surface}
                  onChange={(event) =>
                    patch("surface", event.target.value as TuneInput["surface"])
                  }
                >
                  <option value="Road">Asfalt</option>
                  <option value="Dirt">Dirt</option>
                  <option value="Mixed">Gemengd</option>
                  <option value="Snow">Sneeuw</option>
                </select>
              </Field>
              <Field label="Banden">
                <select
                  value={input.tireCompound}
                  onChange={(event) => patch("tireCompound", event.target.value)}
                >
                  {compounds.map((compound) => (
                    <option key={compound}>{compound}</option>
                  ))}
                </select>
              </Field>
            </div>

            {input.inputMode === "advanced" ? (
              <div className="advanced-panel">
                <h2 className="subheading">Advanced gegevens</h2>
                <div className="field-grid">
                  <Field
                    label="Redline RPM"
                    hint="Open tijdens een testrit de telemetrie, zoek waar de begrenzer ingrijpt en trek circa 100-200 RPM af."
                  >
                    <input
                      type="number"
                      value={input.redlineRpm}
                      onChange={(event) => patch("redlineRpm", Number(event.target.value))}
                    />
                  </Field>
                  <Field label={`Max. koppel (${input.unitSystem === "metric" ? "Nm" : "lb-ft"})`}>
                    <input
                      type="number"
                      value={input.maxTorque}
                      onChange={(event) => patch("maxTorque", Number(event.target.value))}
                    />
                  </Field>
                  <Field label={`Topsnelheid (${input.unitSystem === "metric" ? "km/h" : "mph"})`}>
                    <input
                      type="number"
                      value={input.topSpeed}
                      onChange={(event) => patch("topSpeed", Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Versnellingen">
                    <input
                      type="number"
                      min={input.ev ? "1" : "4"}
                      max="10"
                      value={input.gears}
                      onChange={(event) => patch("gears", Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Bandenmaat voor">
                    <input
                      value={input.tireFront}
                      onChange={(event) => patch("tireFront", event.target.value)}
                    />
                  </Field>
                  <Field label="Bandenmaat achter">
                    <input
                      value={input.tireRear}
                      onChange={(event) => patch("tireRear", event.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            <div className="feel-panel">
              <label>
                <span>Stabiel</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={input.feelStability}
                  onChange={(event) =>
                    patch("feelStability", Number(event.target.value))
                  }
                />
                <span>Speels</span>
              </label>
              <label>
                <span>Rustig</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={input.feelResponse}
                  onChange={(event) =>
                    patch("feelResponse", Number(event.target.value))
                  }
                />
                <span>Direct</span>
              </label>
            </div>
            <button type="button" className="primary-action" onClick={generate}>
              <Gauge size={21} />
              Bereken tune
            </button>
          </section>
        ) : null}

        {step === 3 && result ? (
          <section className="result-screen">
            <div className="result-identity">
              <div>
                <span>
                  {input.year} {input.make}
                </span>
                <strong>{input.model}</strong>
              </div>
              <div className="class-block">
                <b>{input.carClass}</b>
                <em>{input.pi}</em>
              </div>
              <small>{input.driveType}</small>
              <small>{input.tuneMode}</small>
            </div>

            <div className="result-tabs result-tabs--single">
              <strong>
                <Check size={18} />
                Persoonlijk advies
              </strong>
              <span>
                Vertrouwen
                <b>{Math.round(result.confidence * 100)}%</b>
              </span>
            </div>

            {result.warnings.length ? (
              <div className="warning-panel">
                <AlertTriangle size={20} />
                <div>
                  {result.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {input.buildGuide ? (
              <button
                type="button"
                className="applied-build-note"
                onClick={() => {
                  setBuildMode("guide");
                  setStep(1);
                }}
              >
                <SlidersHorizontal size={19} />
                <span>
                  <strong>
                    Build Guide · {buildFocusLabels[input.buildGuide.focus]}
                  </strong>
                  {input.buildGuide.targetClass} {input.buildGuide.targetPi} ·{" "}
                  {input.buildGuide.selectedUpgradeIds.length} upgrades geselecteerd
                  {" · Diff "}
                  {input.capabilities.differential === true
                    ? "full"
                    : input.capabilities.differential === false
                      ? "none"
                      : input.capabilities.differential}
                  {input.buildGuide.valuesConfirmed
                    ? " · waarden gecontroleerd"
                    : " · waarden nog controleren"}
                </span>
              </button>
            ) : null}

            {result.techniqueTips?.length ? (
              <article className="result-technique">
                <div>
                  <Gauge size={19} />
                  <strong>PR Stunt-techniek</strong>
                </div>
                <ol>
                  {result.techniqueTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ol>
              </article>
            ) : null}

            <TuneSections sections={result.sections} />

            <div className="result-actions">
              <button type="button" onClick={saveCurrent}>
                <Bookmark />
                Opslaan
              </button>
              <button type="button" className="is-primary" onClick={() => setModal("diagnosis")}>
                <Stethoscope />
                Diagnose
              </button>
            </div>
            <div className="share-actions">
              <button type="button" onClick={() => setModal("history")}>
                <History />
                Historie ({tuneHistory.length})
              </button>
              <button type="button" onClick={shareCurrent}>
                <Share2 />
                Delen
              </button>
              <button type="button" onClick={() => result && exportTune(result)}>
                <Download />
                JSON
              </button>
              <button type="button" onClick={() => setStep(0)}>
                <RotateCcw />
                Nieuwe tune
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {modal === "diagnosis" && result ? (
        <Modal title="Wat doet de auto?" onClose={() => setModal(null)}>
          <div className="diagnosis-protocol">
            <strong>Test eerst consequent</strong>
            <ol>
              <li>Gebruik dezelfde route, banden en weersomstandigheden.</li>
              <li>Rijd drie schone ronden voordat je een oordeel kiest.</li>
              <li>Kies het probleem dat het vaakst voorkomt, niet één losse fout.</li>
              <li>Pas één revisie toe en vergelijk opnieuw.</li>
            </ol>
          </div>
          <div className="diagnosis-context">
            <div className="diagnosis-context__heading">
              <strong>Leg deze testrit vast</strong>
              <small>Deze context wordt aan de nieuwe revisie gekoppeld.</small>
            </div>
            <Field label="Testlocatie">
              <input
                value={testRunDraft.location}
                onChange={(event) =>
                  setTestRunDraft((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Bijv. Horizon Mexico Circuit"
              />
            </Field>
            <div className="field-grid diagnosis-context__grid">
              <Field label="Schone ronden">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={testRunDraft.cleanLaps}
                  onChange={(event) =>
                    setTestRunDraft((current) => ({
                      ...current,
                      cleanLaps: Math.max(1, Number(event.target.value)),
                    }))
                  }
                />
              </Field>
              <Field label="Besturing">
                <select
                  value={testRunDraft.inputDevice}
                  onChange={(event) =>
                    setTestRunDraft((current) => ({
                      ...current,
                      inputDevice: event.target.value as InputDevice,
                    }))
                  }
                >
                  <option>Controller</option>
                  <option>Wheel</option>
                  <option>Keyboard</option>
                </select>
              </Field>
              <Field label="Assists">
                <select
                  value={testRunDraft.assists}
                  onChange={(event) =>
                    setTestRunDraft((current) => ({
                      ...current,
                      assists: event.target.value as AssistPreset,
                    }))
                  }
                >
                  <option>Off</option>
                  <option>ABS</option>
                  <option>ABS + TCS</option>
                  <option>Custom</option>
                </select>
              </Field>
            </div>
            <Field label="Testritnotitie">
              <textarea
                rows={3}
                value={testRunDraft.notes}
                onChange={(event) =>
                  setTestRunDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Wat gebeurde er consequent, en in welke bochtfase?"
              />
            </Field>
            {!testRunDraft.location.trim() ? (
              <p className="diagnosis-context__required">
                Vul een testlocatie in voordat je een revisie toepast.
              </p>
            ) : null}
          </div>
          <div className="diagnosis-list">
            {DIAGNOSES.map((diagnosis) => (
              <button
                type="button"
                key={diagnosis.id}
                disabled={!testRunDraft.location.trim()}
                onClick={() => applyFeedback(diagnosis.id)}
              >
                <span>{diagnosis.phase}</span>
                <strong>{diagnosis.label}</strong>
                <small>{diagnosis.description}</small>
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {modal === "garage" ? (
        <Modal title="Opgeslagen tunes" onClose={() => setModal(null)} wide>
          <div className="garage-toolbar">
            <button type="button" onClick={() => importRef.current?.click()}>
              <Upload size={18} />
              Importeer JSON
            </button>
            <button
              type="button"
              disabled={!saved.length}
              onClick={() => exportGarage(saved)}
            >
              <Download size={18} />
              Exporteer garage
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => handleImport(event.target.files?.[0])}
            />
          </div>
          <div className="saved-list">
            {saved.length ? (
              saved.map((item) => (
                <article key={item.id}>
                  <button
                    type="button"
                    className="saved-list__load"
                    onClick={() => loadTune(item)}
                  >
                    <span>
                      {item.input.year} {item.input.make}
                    </span>
                    <strong>{item.input.model}</strong>
                    <small>
                      {item.input.carClass} {item.input.pi} · {item.input.tuneMode}
                      {item.revisionReason ? ` · ${item.revisionReason}` : ""}
                    </small>
                  </button>
                  <button
                    type="button"
                    className="saved-list__delete"
                    onClick={() => setSaved(deleteTune(item.id))}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))
            ) : (
              <p className="empty-state">Nog geen tunes opgeslagen.</p>
            )}
          </div>
        </Modal>
      ) : null}

      {modal === "history" && result ? (
        <Modal title="Tunegeschiedenis" onClose={() => setModal(null)} wide>
          <div className="history-summary">
            <History size={20} />
            <span>
              <strong>
                {result.input.year} {result.input.make} {result.input.model}
              </strong>
              {result.input.tuneMode} · {tuneHistory.length} revisies
            </span>
          </div>
          <div className="history-list">
            {tuneHistory.map((item, index) => (
              <button
                type="button"
                className={item.id === result.id ? "is-current" : ""}
                key={item.id}
                onClick={() => loadTune(item)}
              >
                <span className="history-list__index">
                  {String(tuneHistory.length - index).padStart(2, "0")}
                </span>
                <span>
                  <strong>{item.revisionReason ?? "Basisadvies"}</strong>
                  <small>
                    {item.input.carClass} {item.input.pi} ·{" "}
                    {new Date(item.createdAt).toLocaleString("nl-NL")}
                    {item.testRun
                      ? ` · ${item.testRun.location} · ${item.testRun.cleanLaps} ronden`
                      : ""}
                  </small>
                  {item.testRun ? (
                    <em>
                      {item.testRun.inputDevice} · assists {item.testRun.assists}
                      {item.testRun.notes ? ` · ${item.testRun.notes}` : ""}
                    </em>
                  ) : null}
                </span>
                {item.id === result.id ? <b>Actief</b> : null}
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {modal === "menu" ? (
        <Modal title="Over deze app" onClose={() => setModal(null)}>
          <p className="modal-note">
            Persoonlijke, offline FH6 tuning companion. Niet gelieerd aan Microsoft,
            Xbox, Turn 10 of Playground Games.
          </p>
          <p className="modal-note">
            <strong>App {packageJson.version}</strong>
            <br />
            Tune-engine {ENGINE_VERSION.replace("fh6-companion-", "")}
            <br />
            Build Guide {BUILD_GUIDE_VERSION.replace("build-guide-", "")}
          </p>
          <p className="modal-note">
            De Build Guide combineert openbare gidsen en calculators met lokale,
            versieerbare regels. Autospecifieke onderdelen en PI-kosten moeten in
            FH6 worden gecontroleerd.
          </p>
          <div className="install-panel">
            <Smartphone size={23} />
            <div>
              <strong>Installeer op je telefoon</strong>
              {installPrompt ? (
                <>
                  <p>
                    Deze browser kan de Tune Companion direct als app installeren.
                  </p>
                  <button type="button" onClick={installApp}>
                    Installeer app
                  </button>
                </>
              ) : (
                <>
                  <p>
                    iPhone/iPad: open in Safari, kies Delen en daarna Zet op
                    beginscherm.
                  </p>
                  <p>
                    Android: open het Chrome-menu en kies App installeren of Toevoegen
                    aan startscherm.
                  </p>
                </>
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export default App;
