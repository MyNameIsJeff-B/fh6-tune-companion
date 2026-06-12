import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  Gauge,
  Info,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILD_CLASS_OPTIONS,
  CLASS_CAPS,
  applyBuildPlan,
  defaultBuildConfig,
  defaultSelectedUpgrades,
  generateBuildPlan,
} from "../build-guide/engine";
import { BUILD_SOURCES } from "../build-guide/sources";
import {
  buildProfileLabel,
  findBuildProfile,
  loadBuildProfiles,
} from "../build-guide/profiles";
import type {
  BuildCarProfile,
  BuildFocus,
  BuildGuideConfig,
  BuildPriority,
  BuildUpgradeId,
} from "../build-guide/types";
import { TUNE_MODES } from "../domain/defaults";
import { SEASONS, seasonProfile } from "../domain/seasons";
import type {
  BuildCapabilities,
  Season,
  Surface,
  TuneInput,
  TuneMode,
} from "../domain/types";
import { Field, Segmented } from "./Field";

const priorityLabel: Record<BuildPriority, string> = {
  recommend: "Aanbevolen",
  optional: "Optioneel",
  later: "Later",
  avoid: "Vermijden",
};

const focusOptions: Array<{ value: BuildFocus; label: string }> = [
  { value: "balanced", label: "Balans" },
  { value: "grip", label: "Grip" },
  { value: "acceleration", label: "Acceleratie" },
  { value: "speed", label: "Topsnelheid" },
  { value: "control", label: "Controle" },
];

const capabilitySummary = (
  patch?: Partial<BuildCapabilities>,
): string | undefined => {
  if (!patch) return undefined;
  const unlocked: string[] = [];
  if (patch.gearing === "final") unlocked.push("Final Drive");
  if (patch.gearing === "full") unlocked.push("Full Gearing");
  if (patch.differential === "accel") unlocked.push("Differential Acceleration");
  if (patch.differential === "full") unlocked.push("Differential volledig");
  if (patch.alignment) unlocked.push("Alignment");
  if (patch.arb) unlocked.push("Anti-Roll Bars");
  if (patch.springs) unlocked.push("Springs");
  if (patch.damping) unlocked.push("Damping");
  if (patch.brakes) unlocked.push("Brakes");
  if (patch.aero) unlocked.push("Aero");
  return unlocked.length ? unlocked.join(" / ") : undefined;
};

export function BuildGuide({
  input,
  onApply,
  onManual,
}: {
  input: TuneInput;
  onApply: (input: TuneInput, continueToGoal: boolean) => void;
  onManual: () => void;
}) {
  const [config, setConfig] = useState<BuildGuideConfig>(() =>
    defaultBuildConfig(input),
  );
  const [selected, setSelected] = useState<BuildUpgradeId[]>(() =>
    input.buildGuide?.selectedUpgradeIds ??
    defaultSelectedUpgrades(generateBuildPlan(input, defaultBuildConfig(input))),
  );
  const [openStage, setOpenStage] = useState("tires");
  const [showSources, setShowSources] = useState(false);
  const [profiles, setProfiles] = useState<BuildCarProfile[]>([]);
  const [profileError, setProfileError] = useState("");
  const appliedProfileDefaults = useRef(false);
  const profile = useMemo(
    () => findBuildProfile(profiles, input),
    [profiles, input],
  );
  const plan = useMemo(
    () => generateBuildPlan(input, config, profile),
    [input, config, profile],
  );
  const selectedCapabilities = useMemo(
    () => applyBuildPlan(input, plan, selected).capabilities,
    [input, plan, selected],
  );

  useEffect(() => {
    loadBuildProfiles().then(setProfiles).catch((error: Error) => {
      setProfileError(error.message);
    });
  }, []);

  useEffect(() => {
    if (!profile || appliedProfileDefaults.current) return;
    setSelected(defaultSelectedUpgrades(plan));
    appliedProfileDefaults.current = true;
  }, [plan, profile]);

  const changeConfig = (patch: Partial<BuildGuideConfig>) => {
    const nextConfig = { ...config, ...patch };
    const nextPlan = generateBuildPlan(input, nextConfig, profile);
    setConfig(nextConfig);
    setSelected(defaultSelectedUpgrades(nextPlan));
  };

  const toggleUpgrade = (id: BuildUpgradeId) => {
    const clicked = plan.stages
      .flatMap((stage) => stage.upgrades)
      .find((upgrade) => upgrade.id === id);
    const compoundIds = new Set(
      plan.stages
        .flatMap((stage) => stage.upgrades)
        .filter((upgrade) => upgrade.tireCompound)
        .map((upgrade) => upgrade.id),
    );
    const differentialIds = new Set<BuildUpgradeId>([
      "sport-differential",
      "differential",
    ]);
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      const withoutOtherCompounds = clicked?.tireCompound
        ? current.filter((item) => !compoundIds.has(item))
        : current;
      const withoutOtherDifferentials = differentialIds.has(id)
        ? withoutOtherCompounds.filter((item) => !differentialIds.has(item))
        : withoutOtherCompounds;
      return [...withoutOtherDifferentials, id];
    });
  };

  const finish = (continueToGoal: boolean) => {
    onApply(applyBuildPlan(input, plan, selected), continueToGoal);
  };

  return (
    <section className="build-guide">
      <div className="build-guide__identity">
        <div className="class-block">
          <b>{config.targetClass}</b>
          <em>{config.targetPi}</em>
        </div>
        <strong>{input.driveType}</strong>
        <span>{config.tuneMode}</span>
        <small>{Math.round(plan.confidence * 100)}% vertrouwen</small>
      </div>

      <div className="build-guide__config">
        <div className="screen-heading">
          <span>02</span>
          <div>
            <h1>Build Guide</h1>
            <p>Kies eerst het doel. De guide bouwt daarna de upgradevolgorde.</p>
          </div>
        </div>

        {profile ? (
          <article className="build-profile">
            <div className="build-profile__heading">
              <span>
                <Sparkles size={18} />
                Autoprofiel
              </span>
              <b>{profile.carType}</b>
            </div>
            <strong>{profile.note}</strong>
            <p>
              Stock {profile.stockClass} {profile.stockPi} / {profile.stockDrive} /
              profiel ondersteunt de gekozen discipline
            </p>
            <div className="build-profile__columns">
              <div>
                <span>
                  <ListChecks size={15} />
                  Auto-baseline
                </span>
                <ol>
                  {profile.order.slice(0, 5).map((item) => (
                    <li key={item}>{buildProfileLabel(item)}</li>
                  ))}
                </ol>
              </div>
              <div>
                <span>
                  <X size={15} />
                  Vermijden
                </span>
                <ul>
                  {profile.avoid.map((item) => (
                    <li key={item}>{buildProfileLabel(item)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ) : (
          <p className="build-profile__fallback">
            {profileError || "Generiek profiel actief; er is geen betrouwbare autospecifieke match gevonden."}
          </p>
        )}

        <div className="field-grid">
          <Field label="Doelklasse">
            <select
              value={config.targetClass}
              onChange={(event) => {
                const targetClass = event.target.value;
                changeConfig({
                  targetClass,
                  targetPi: CLASS_CAPS[targetClass],
                });
              }}
            >
              {BUILD_CLASS_OPTIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Doel-PI" hint="Bevestig de uiteindelijke waarde in-game.">
            <input
              type="number"
              min="100"
              max={CLASS_CAPS[config.targetClass]}
              value={config.targetPi}
              onChange={(event) =>
                changeConfig({ targetPi: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Discipline">
            <select
              value={config.tuneMode}
              onChange={(event) =>
                changeConfig({ tuneMode: event.target.value as TuneMode })
              }
            >
              {TUNE_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ondergrond">
            <select
              value={config.surface}
              onChange={(event) =>
                changeConfig({ surface: event.target.value as Surface })
              }
            >
              <option value="Road">Road</option>
              <option value="Dirt">Dirt</option>
              <option value="Mixed">Mixed</option>
              <option value="Snow">Snow</option>
            </select>
          </Field>
          <Field label="Seizoen">
            <select
              value={config.season}
              onChange={(event) =>
                changeConfig({ season: event.target.value as Season })
              }
            >
              {SEASONS.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.id}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Segmented<BuildFocus>
          label="Buildprioriteit"
          value={config.focus}
          options={focusOptions}
          onChange={(focus) => changeConfig({ focus })}
        />

        <div className="build-constraints">
          <label>
            <input
              type="checkbox"
              checked={config.keepStockEngine}
              onChange={(event) =>
                changeConfig({ keepStockEngine: event.target.checked })
              }
            />
            Stock Engine behouden
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.keepStockDrivetrain}
              onChange={(event) =>
                changeConfig({ keepStockDrivetrain: event.target.checked })
              }
            />
            Stock Drivetrain behouden
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.avoidAero}
              onChange={(event) =>
                changeConfig({ avoidAero: event.target.checked })
              }
            />
            Zichtbare Aero vermijden
          </label>
        </div>
      </div>

      <div className="build-guide__summary">
        <span>
          <Gauge size={19} />
          Doel: <b>{focusOptions.find((item) => item.value === config.focus)?.label}</b>
        </span>
        <span>
          PI-budget: <b>{plan.piBudget}</b>
        </span>
      </div>

      <div className="build-warning">
        <Info />
        <span>
          <strong>{config.season}-omstandigheden</strong>
          {seasonProfile(config.season).conditions}{" "}
          {seasonProfile(config.season).guidance}
        </span>
      </div>

      <div
        className="build-alerts"
        role="region"
        aria-label="Buildwaarschuwingen"
      >
        <div className="build-alerts__heading">
          <AlertTriangle size={18} />
          <strong>Voor je onderdelen koopt</strong>
        </div>
        <ul>
          {plan.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>

      <div className="build-access">
        <span>
          <strong>Geselecteerde tuningtoegang</strong>
          Gearing: {selectedCapabilities.gearing} / Differential:{" "}
          {selectedCapabilities.differential === true
            ? "full"
            : selectedCapabilities.differential === false
              ? "none"
              : selectedCapabilities.differential}
        </span>
      </div>

      <div className="build-stages">
        {plan.stages.map((item, index) => {
          const isOpen = openStage === item.id;
          const selectedCount = item.upgrades.filter((candidate) =>
            selected.includes(candidate.id),
          ).length;
          return (
            <article className={`build-stage ${isOpen ? "is-open" : ""}`} key={item.id}>
              <button
                type="button"
                className="build-stage__header"
                onClick={() => setOpenStage(isOpen ? "" : item.id)}
                aria-expanded={isOpen}
              >
                <span className="build-stage__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="build-stage__title">
                  <strong>{item.label}</strong>
                  <small>{item.summary}</small>
                </span>
                <em className={`priority priority--${item.priority}`}>
                  {priorityLabel[item.priority]}
                </em>
                <ChevronDown className="build-stage__chevron" size={21} />
              </button>
              {isOpen ? (
                <div className="build-stage__body">
                  {item.upgrades.map((candidate) => {
                    const checked = selected.includes(candidate.id);
                    return (
                      <label className="upgrade-row" key={candidate.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUpgrade(candidate.id)}
                        />
                        <span>
                          <strong>{candidate.name}</strong>
                          <small>{candidate.detail}</small>
                          {capabilitySummary(candidate.capabilityPatch) ? (
                            <small className="upgrade-row__unlocks">
                              Ontgrendelt: {capabilitySummary(candidate.capabilityPatch)}
                            </small>
                          ) : null}
                        </span>
                        <em className={`priority priority--${candidate.priority}`}>
                          {priorityLabel[candidate.priority]}
                        </em>
                        <i
                          className={`confidence-dot ${
                            candidate.confidence >= 0.75
                              ? "is-high"
                              : candidate.confidence >= 0.6
                                ? "is-medium"
                                : "is-low"
                          }`}
                          title={`${Math.round(candidate.confidence * 100)}% vertrouwen`}
                        />
                      </label>
                    );
                  })}
                  <p className="build-stage__selection">
                    <Check size={15} />
                    {selectedCount} van {item.upgrades.length} geselecteerd
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="build-warning">
        <AlertTriangle />
        <span>
          <strong>Bevestig de build in-game</strong>
          Beschikbaarheid en PI-kosten verschillen per auto. Vul na montage de echte
          PI, het gewicht en de weight distribution in.
        </span>
      </div>

      <button
        type="button"
        className="build-explainer"
        onClick={() => setShowSources((current) => !current)}
      >
        <Info />
        <span>
          <strong>Waarom deze volgorde?</strong>
          {profile
            ? `${profile.carType}: ${profile.note}`
            : "Begin met grip en instelbaarheid, daarna gewicht en controle, en voeg power en Aero als laatste toe."}
        </span>
        <BookOpen />
      </button>

      {showSources ? (
        <div className="source-list">
          {BUILD_SOURCES.map((item) => (
            <article key={item.id}>
              <span>{item.kind}</span>
              <strong>{item.title}</strong>
              <p>{item.use}</p>
              <small>{item.limitation}</small>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.publisher}
                  <ExternalLink size={14} />
                </a>
              ) : (
                <em>{item.publisher}</em>
              )}
            </article>
          ))}
        </div>
      ) : null}

      <div className="build-guide__actions">
        <button type="button" onClick={() => finish(false)}>
          <SlidersHorizontal />
          Build toepassen
        </button>
        <button type="button" className="is-primary" onClick={() => finish(true)}>
          <Gauge />
          Verder
        </button>
      </div>
      <button type="button" className="text-action" onClick={onManual}>
        Ik heb al een build, handmatig invoeren
      </button>
    </section>
  );
}
