import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  Gauge,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CLASS_CAPS,
  applyBuildPlan,
  defaultBuildConfig,
  defaultSelectedUpgrades,
  generateBuildPlan,
} from "../build-guide/engine";
import { BUILD_SOURCES } from "../build-guide/sources";
import type {
  BuildFocus,
  BuildGuideConfig,
  BuildPriority,
  BuildUpgradeId,
} from "../build-guide/types";
import { TUNE_MODES } from "../domain/defaults";
import type { Surface, TuneInput, TuneMode } from "../domain/types";
import { Field, Segmented } from "./Field";

const priorityLabel: Record<BuildPriority, string> = {
  recommend: "Aanraden",
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
  const [openStage, setOpenStage] = useState("foundation");
  const [showSources, setShowSources] = useState(false);
  const plan = useMemo(() => generateBuildPlan(input, config), [input, config]);

  const changeConfig = (patch: Partial<BuildGuideConfig>) => {
    const nextConfig = { ...config, ...patch };
    const nextPlan = generateBuildPlan(input, nextConfig);
    setConfig(nextConfig);
    setSelected(defaultSelectedUpgrades(nextPlan));
  };

  const toggleUpgrade = (id: BuildUpgradeId) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
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
            <p>Kies eerst wat de auto moet doen. Daarna bouwen we de upgradevolgorde.</p>
          </div>
        </div>

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
              {Object.keys(CLASS_CAPS).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Doel PI" hint="Pas later aan naar de echte waarde in de game.">
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
              <option value="Road">Asfalt</option>
              <option value="Dirt">Dirt</option>
              <option value="Mixed">Gemengd</option>
              <option value="Snow">Sneeuw</option>
            </select>
          </Field>
        </div>

        <Segmented<BuildFocus>
          label="Prioriteit"
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
            Standaardmotor behouden
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.keepStockDrivetrain}
              onChange={(event) =>
                changeConfig({ keepStockDrivetrain: event.target.checked })
              }
            />
            Aandrijving behouden
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.avoidAero}
              onChange={(event) =>
                changeConfig({ avoidAero: event.target.checked })
              }
            />
            Geen zichtbare aero
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
          <strong>Controleer PI in de game</strong>
          Upgradeprijzen en beschikbaarheid verschillen per auto. Vul na montage de
          echte PI, het gewicht en de verdeling in.
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
          Eerst grip en instelbaarheid, dan gewicht en controle, daarna pas vermogen
          en aero.
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
          Naar doel
        </button>
      </div>
      <button type="button" className="text-action" onClick={onManual}>
        Ik heb al een build, handmatig invoeren
      </button>
    </section>
  );
}
