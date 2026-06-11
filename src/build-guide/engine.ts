import type {
  BuildCapabilities,
  DriveType,
  TuneInput,
} from "../domain/types";
import type {
  AppliedBuildGuide,
  BuildGuideConfig,
  BuildCarProfile,
  BuildPlan,
  BuildPriority,
  BuildStage,
  BuildUpgrade,
  BuildUpgradeId,
} from "./types";
import { seasonProfile } from "../domain/seasons";

export const BUILD_GUIDE_VERSION = "build-guide-0.4.0";

// FH6 sources conflict on the post-launch PI caps, and R may be a type class
// rather than a true 999-point band. Keep these caps until verified in-game.
export const CLASS_CAPS: Record<string, number> = {
  D: 500,
  C: 600,
  B: 700,
  A: 800,
  S1: 900,
  S2: 998,
  R: 999,
  // Accepted for old saved builds and imports; FH6 now labels the top class R.
  X: 999,
};

export const BUILD_CLASS_OPTIONS = ["D", "C", "B", "A", "S1", "S2", "R"];

const source = ["forzatune-guide", "quicktune-guide", "optn", "in-game"];
const CLASS_ORDER = ["D", "C", "B", "A", "S1", "S2", "R"];

const upgrade = (
  id: BuildUpgradeId,
  name: string,
  detail: string,
  priority: BuildPriority,
  options: Partial<BuildUpgrade> = {},
): BuildUpgrade => ({
  id,
  name,
  detail,
  priority,
  confidence: options.confidence ?? 0.72,
  sourceIds: options.sourceIds ?? source,
  capabilityPatch: options.capabilityPatch,
  tireCompound: options.tireCompound,
});

const stage = (
  id: BuildStage["id"],
  label: string,
  summary: string,
  priority: BuildPriority,
  upgrades: BuildUpgrade[],
): BuildStage => ({ id, label, summary, priority, upgrades });

const tireChoice = (
  config: BuildGuideConfig,
  profile?: BuildCarProfile,
): Pick<BuildUpgrade, "id" | "name" | "tireCompound" | "detail"> => {
  if (config.surface === "Snow") {
    return {
      id: "snow-tires",
      name: "Snow compound",
      tireCompound: "Snow",
      detail: "Snow grip comes before extra power.",
    };
  }
  if (config.tuneMode === "Drag") {
    return {
      id: "drag-tires",
      name: "Drag compound",
      tireCompound: "Drag",
      detail: "Maximise traction at launch.",
    };
  }
  if (config.tuneMode === "Drift") {
    return {
      id: "drift-tires",
      name: "Drift compound",
      tireCompound: "Drift",
      detail: "Prioritise predictable slip angle and tire temperature.",
    };
  }
  if (
    config.tuneMode === "Rain" &&
    !["D", "C", "B"].includes(config.targetClass)
  ) {
    return {
      id: "semi-slick-tires",
      name: "Race Semi-Slick",
      tireCompound: "Race Semi-Slick",
      detail: "Retains useful wet-weather capability that Race Slicks do not provide.",
    };
  }
  if (
    profile?.preset === "cross_country_a_s1" &&
    (config.surface === "Dirt" ||
      config.surface === "Mixed" ||
      config.tuneMode === "Rally")
  ) {
    return {
      id: "offroad-tires",
      name: "Off-Road Tires",
      tireCompound: "Off-Road",
      detail: "Cross Country needs impact absorption and traction on rough terrain.",
    };
  }
  if (config.surface === "Dirt" || config.surface === "Mixed" || config.tuneMode === "Rally") {
    return {
      id: "rally-tires",
      name: "Rally compound",
      tireCompound: "Rally",
      detail: "Loose surfaces require the correct tire first. Race Slicks and, to a lesser extent, Sport/Semi-Slick lose substantially more grip on dirt in FH6.",
    };
  }
  if (["D", "C"].includes(config.targetClass)) {
    return {
      id: "street-tires",
      name: "Street compound",
      tireCompound: "Street",
      detail: "Save PI for weight and balance; avoid over-tyring the car.",
    };
  }
  if (config.targetClass === "B") {
    return {
      id: "sport-tires",
      name: "Sport compound",
      tireCompound: "Sport",
      detail: "Strong grip gain without spending the entire PI budget.",
    };
  }
  if (["A", "S1"].includes(config.targetClass)) {
    return {
      id: "semi-slick-tires",
      name: "Race semi-slick",
      tireCompound: "Race Semi-Slick",
      detail: "A suitable starting point for fast road and circuit builds.",
    };
  }
  return {
    id: "slick-tires",
    name: "Race slick",
    tireCompound: "Race Slick",
    detail: "High classes and speed demand maximum road grip.",
  };
};

const widthUpgrade = (driveType: DriveType): BuildUpgrade => {
  if (driveType === "FWD") {
    return upgrade(
      "front-width",
      "Widen Front Tires First",
      "The front axle steers and delivers power. Widen the rear only when balance or PI requires it.",
      "recommend",
      { confidence: 0.78 },
    );
  }
  if (driveType === "RWD") {
    return upgrade(
      "rear-width",
      "Widen Rear Tires First",
      "Improves corner-exit traction. Add front width if turn-in or braking grip is lacking.",
      "recommend",
      { confidence: 0.78 },
    );
  }
  return upgrade(
    "balanced-width",
    "Increase Width Evenly",
    "AWD distributes power across both axles; avoid an extreme front-to-rear width difference.",
    "recommend",
    { confidence: 0.75 },
  );
};

const weightUpgrades = (targetClass: string): BuildUpgrade[] => {
  const items = [
    upgrade(
      "weight-1",
      "Weight Reduction Stage 1",
      "Improves braking, acceleration, and direction changes at the same time.",
      "recommend",
      { confidence: 0.82, sourceIds: ["forzatune-guide", "optn", "in-game"] },
    ),
  ];
  if (["A", "S1", "S2", "R", "X"].includes(targetClass)) {
    items.push(
      upgrade(
        "weight-2",
        "Weight Reduction Stage 2",
        "Choose this while its PI value remains better than adding engine power.",
        "recommend",
      ),
    );
  }
  if (["S1", "S2", "R", "X"].includes(targetClass)) {
    items.push(
      upgrade(
        "weight-3",
        "Weight Reduction Stage 3",
        "Use only if the car does not become nervous and the PI cost makes sense.",
        "optional",
        { confidence: 0.62 },
      ),
    );
  }
  return items;
};

export function defaultBuildConfig(input: TuneInput): BuildGuideConfig {
  const saved = input.buildGuide;
  const savedTargetClass = saved?.targetClass === "X" ? "R" : saved?.targetClass;
  const targetClass =
    savedTargetClass && savedTargetClass in CLASS_CAPS
      ? savedTargetClass
      : input.carClass in CLASS_CAPS
        ? input.carClass === "X"
          ? "R"
          : input.carClass
        : "A";
  return {
    tuneMode: saved?.tuneMode ?? input.tuneMode,
    season: saved?.season ?? input.season ?? "Summer",
    surface: saved?.surface ?? input.surface,
    focus: saved?.focus ?? "balanced",
    targetClass,
    targetPi: saved?.targetPi ?? CLASS_CAPS[targetClass] ?? 800,
    keepStockEngine: saved?.keepStockEngine ?? true,
    keepStockDrivetrain: saved?.keepStockDrivetrain ?? true,
    avoidAero: saved?.avoidAero ?? !input.hasAero,
  };
}

export function generateBuildPlan(
  input: TuneInput,
  config: BuildGuideConfig,
  profile?: BuildCarProfile,
): BuildPlan {
  const profileRequires = (term: string) =>
    profile?.required.some((item) => item.toLowerCase().includes(term)) ?? false;
  const profileAvoids = (...terms: string[]) =>
    profile?.avoid.some((item) =>
      terms.some((term) => item.toLowerCase().includes(term)),
    ) ?? false;
  const tire = tireChoice(config, profile);
  const offroad =
    config.surface === "Dirt" ||
    config.surface === "Mixed" ||
    config.surface === "Snow" ||
    config.tuneMode === "Rally";
  const roadRace =
    config.surface === "Road" &&
    !["Drag", "Drift"].includes(config.tuneMode);
  const transmission =
    ["Drag", "Drift", "Wangan"].includes(config.tuneMode) ||
    ["acceleration", "speed"].includes(config.focus) ||
    ["S1", "S2", "R", "X"].includes(config.targetClass)
      ? upgrade(
          "race-transmission",
          "Race transmission",
          "Full gearing is useful for major power or top-speed changes.",
          "recommend",
          { capabilityPatch: { gearing: "full" }, confidence: 0.76 },
        )
      : upgrade(
          "sport-transmission",
          "Sport transmission",
          "Adjustable Final Drive without unnecessary complexity.",
          "recommend",
          { capabilityPatch: { gearing: "final" }, confidence: 0.76 },
        );

  const foundation = stage(
    "foundation",
    "Foundation",
    "Unlock the inexpensive, high-impact adjustments first.",
    "recommend",
    [
      upgrade(
        "differential",
        "Race differential",
        `${input.driveType}: directly adjust traction and corner exit.`,
        "recommend",
        { capabilityPatch: { differential: true }, confidence: 0.86 },
      ),
      transmission,
      upgrade(
        "arb",
        offroad ? "Adjustable Anti-Roll Bars" : "Race Front & Rear Anti-Roll Bars",
        offroad
          ? "Optional on loose surfaces; excessive stiffness reduces independent wheel contact."
          : "The fastest first correction for mid-corner balance.",
        offroad && !profileRequires("arb") ? "optional" : "recommend",
        { capabilityPatch: { arb: true }, confidence: 0.84 },
      ),
    ],
  );

  const tires = stage(
    "tires",
    "Tires",
    `${tire.name}; width follows the driven axle and available PI.`,
    "recommend",
    [
      upgrade(tire.id, tire.name, tire.detail, "recommend", {
        capabilityPatch: { tires: true },
        tireCompound: tire.tireCompound,
        confidence: 0.78,
        sourceIds:
          tire.id === "offroad-tires"
            ? ["forzafire-tires", "in-game"]
            : undefined,
      }),
      widthUpgrade(input.driveType),
      ...(config.focus === "grip" && !offroad
        ? [
            upgrade(
              input.driveType === "RWD" ? "front-width" : "rear-width",
              input.driveType === "RWD"
                ? "Fine-Tune Front Width Next"
                : "Fine-Tune Rear Width Next",
              "Add width to the second axle only when lap time or balance genuinely improves.",
              "optional" as const,
              { confidence: 0.66, sourceIds: ["optn", "in-game"] },
            ),
          ]
        : []),
    ],
  );

  const crossCountryProfile = profile?.preset === "cross_country_a_s1";
  const suspensionId = config.tuneMode === "Drift"
    ? "drift-suspension"
    : offroad
      ? crossCountryProfile
        ? "offroad-suspension"
        : "rally-suspension"
      : "race-suspension";
  const suspensionName = config.tuneMode === "Drift"
    ? "Drift suspension"
    : offroad
      ? crossCountryProfile
        ? "Off-Road suspension"
        : "Rally suspension"
      : "Race suspension";
  const chassis = stage(
    "chassis",
    "Brakes & Chassis",
    offroad
      ? "Suspension travel and control come before a low ride height."
      : "Add these after choosing tires, balance, and weight reduction.",
    offroad ||
      profileRequires("race_springs") ||
      profileRequires("offroad_suspension") ||
      profileRequires("rally_suspension") ||
      config.focus === "control" ||
      ["S1", "S2", "R", "X"].includes(config.targetClass)
      ? "recommend"
      : "optional",
    [
      upgrade(
        suspensionId,
        suspensionName,
        offroad
          ? "Adds suspension travel and suitable damping for uneven terrain."
          : "Unlocks camber, springs, ride height, and damping.",
        "recommend",
        {
          capabilityPatch: {
            alignment: true,
            springs: true,
            damping: true,
          },
          confidence: 0.86,
        },
      ),
      upgrade(
        "race-brakes",
        "Race Brakes",
        "ForzaFire and gamingpromax report that FH6 road builds from A-class upward benefit strongly from consistent braking and reduced lock-up; verify the PI cost per car.",
        config.focus === "control" ||
          profileRequires("race_brakes") ||
          (roadRace && ["A", "S1", "S2", "R", "X"].includes(config.targetClass)) ||
          ["S1", "S2", "R", "X"].includes(config.targetClass)
          ? "recommend"
          : "optional",
        {
          capabilityPatch: { brakes: true },
          confidence: 0.78,
          sourceIds: ["forzafire-platform", "in-game"],
        },
      ),
      upgrade(
        "chassis-reinforcement",
        "Chassis Reinforcement",
        "Use only when the added stability is worth the extra weight.",
        "later",
        { confidence: 0.55, sourceIds: ["optn", "in-game"] },
      ),
    ],
  );

  const powerEarly =
    config.focus === "speed" ||
    config.focus === "acceleration" ||
    ["Drag", "Wangan"].includes(config.tuneMode);
  const power = stage(
    "power",
    "Power",
    powerEarly
      ? "Spend the remaining PI budget specifically on acceleration or top speed."
      : "Add power only after the car can use it.",
    powerEarly ? "recommend" : "later",
    [
      upgrade(
        "power-light",
        "Light Engine Upgrades",
        config.keepStockEngine
          ? "Keep the engine character and add power in small, measurable steps."
          : "Compare each step on power, weight, and PI; more horsepower is not automatically faster.",
        powerEarly ? "recommend" : "later",
        { confidence: 0.68, sourceIds: ["quicktune-guide", "optn", "in-game"] },
      ),
      upgrade(
        "power-heavy",
        "Aspiration or Engine Swap",
        config.keepStockEngine
          ? "Skipped because the stock engine is being retained."
          : "Choose late and re-check weight, balance, powerband, and required gearing.",
        config.keepStockEngine || profileAvoids("engine swap", "huge turbo", "turbo lag")
          ? "avoid"
          : "optional",
        { confidence: 0.52, sourceIds: ["quicktune-guide", "in-game"] },
      ),
    ],
  );

  const aeroUseful =
    !config.avoidAero &&
    !profileAvoids("heavy aero", "circuit aero", "no aero") &&
    !offroad &&
    config.tuneMode !== "Drag" &&
    ["A", "S1", "S2", "R", "X"].includes(config.targetClass);
  const aero = stage(
    "aero",
    "Aero",
    aeroUseful
      ? "Use downforce only when fast-corner grip is worth the top-speed penalty."
      : "Mechanical grip and a clean build take priority.",
    aeroUseful ? "optional" : "later",
    [
      upgrade(
        "front-aero",
        "Adjustable Front Aero",
        "Improves high-speed turn-in but costs top speed and often PI.",
        aeroUseful ? "optional" : profileAvoids("aero") ? "avoid" : "later",
        { capabilityPatch: { aero: true }, confidence: 0.62 },
      ),
      upgrade(
        "rear-aero",
        "Adjustable Rear Aero",
        "Adds high-speed stability; avoid an unnecessarily high setting.",
        aeroUseful ? "optional" : profileAvoids("aero") ? "avoid" : "later",
        { capabilityPatch: { aero: true }, confidence: 0.62 },
      ),
    ],
  );

  const warnings = [
    "Confirm actual part availability and PI cost in FH6.",
    "After installation, enter the actual weight, weight distribution, and PI.",
  ];
  const season = seasonProfile(config.season);
  warnings.push(`${season.id}: ${season.guidance}`);
  if (!config.keepStockDrivetrain) {
    warnings.push("A drivetrain swap changes the balance significantly; validate it as a new build.");
  }
  if (config.targetPi < input.pi) {
    warnings.push("The target PI is below the current car; remove upgrades in FH6 first.");
  }
  const nativeClass = profile?.stockClass ?? input.carClass;
  const nativeClassIndex = CLASS_ORDER.indexOf(nativeClass === "X" ? "R" : nativeClass);
  const targetClassIndex = CLASS_ORDER.indexOf(
    config.targetClass === "X" ? "R" : config.targetClass,
  );
  if (nativeClassIndex >= 0 && targetClassIndex >= nativeClassIndex + 2) {
    warnings.push(
      `Community build research: target class ${config.targetClass} is at least two classes above native ${nativeClass}; native-class cars usually use the PI budget more efficiently.`,
    );
  }
  if (profile?.risks.includes("needs_in_game_weight_for_exact_springs")) {
    warnings.push("This car type needs confirmed in-game weight and spring ranges for exact spring values.");
  }

  const weight = stage(
    "weight",
    "Weight",
    "Lower mass improves nearly every performance area.",
    "recommend",
    weightUpgrades(config.targetClass),
  );
  const stages = [foundation, tires, weight, chassis, power, aero];
  const genericOrder: BuildStage["id"][] = [
    "tires",
    "foundation",
    "weight",
    "chassis",
    "power",
    "aero",
  ];
  const disciplineOrder: Partial<Record<TuneInput["tuneMode"], BuildStage["id"][]>> = {
    Rally: ["tires", "chassis", "foundation", "weight", "power", "aero"],
    Drag: ["power", "tires", "foundation", "weight", "chassis", "aero"],
    Drift: ["tires", "foundation", "chassis", "weight", "power", "aero"],
    Wangan: ["power", "foundation", "tires", "aero", "chassis", "weight"],
    Rain: ["tires", "chassis", "weight", "foundation", "power", "aero"],
  };
  const profileOrder = profile?.order.flatMap((item): BuildStage["id"][] => {
    const value = item.toLowerCase();
    if (value.includes("tire") || value.includes("slick")) return ["tires"];
    if (
      value.includes("brake") ||
      value.includes("suspension") ||
      value.includes("spring") ||
      value.includes("arb")
    ) return ["chassis"];
    if (value.includes("weight")) return ["weight"];
    if (
      value.includes("diff") ||
      value.includes("gear") ||
      value.includes("transmission") ||
      value.includes("drivetrain")
    ) return ["foundation"];
    if (
      value.includes("power") ||
      value.includes("engine") ||
      value.includes("turbo")
    ) return ["power"];
    if (value.includes("aero")) return ["aero"];
    return [];
  });
  const requestedOrder =
    disciplineOrder[config.tuneMode] ??
    (profileOrder?.length ? profileOrder : genericOrder);
  const stageOrder = [...new Set([...requestedOrder, ...genericOrder])];
  const orderedStages = stageOrder
    .map((id) => stages.find((item) => item.id === id))
    .filter((item): item is BuildStage => Boolean(item));

  return {
    version: BUILD_GUIDE_VERSION,
    config,
    driveType: input.driveType,
    currentPi: input.pi,
    piBudget: Math.max(0, config.targetPi - input.pi),
    confidence: Number(
      Math.max(
        0.48,
        0.78 +
          (profile ? 0.06 : 0) -
          (config.keepStockEngine ? 0 : 0.06) -
          (config.keepStockDrivetrain ? 0 : 0.08),
      ).toFixed(2),
    ),
    warnings,
    profile,
    stages: orderedStages,
  };
}

export function defaultSelectedUpgrades(plan: BuildPlan): BuildUpgradeId[] {
  return plan.stages
    .filter((stage) => stage.priority === "recommend")
    .flatMap((item) => item.upgrades)
    .filter((item) => item.priority === "recommend")
    .map((item) => item.id);
}

export function applyBuildPlan(
  input: TuneInput,
  plan: BuildPlan,
  selectedIds: BuildUpgradeId[],
): TuneInput {
  const selected = new Set(selectedIds);
  const selectedUpgrades = plan.stages
    .flatMap((item) => item.upgrades)
    .filter((item) => selected.has(item.id));
  const capabilities: BuildCapabilities = {
    tires: true,
    gearing: "none",
    alignment: false,
    arb: false,
    springs: false,
    damping: false,
    aero: false,
    brakes: false,
    differential: false,
  };

  for (const item of selectedUpgrades) {
    if (!item.capabilityPatch) continue;
    Object.assign(capabilities, item.capabilityPatch);
  }

  const compound = selectedUpgrades.find((item) => item.tireCompound)?.tireCompound;
  const applied: AppliedBuildGuide = {
    version: plan.version,
    focus: plan.config.focus,
    targetClass: plan.config.targetClass,
    targetPi: plan.config.targetPi,
    tuneMode: plan.config.tuneMode,
    season: plan.config.season,
    surface: plan.config.surface,
    keepStockEngine: plan.config.keepStockEngine,
    keepStockDrivetrain: plan.config.keepStockDrivetrain,
    avoidAero: plan.config.avoidAero,
    selectedUpgradeIds: selectedIds,
    warnings: plan.warnings,
    valuesConfirmed: false,
  };

  return {
    ...input,
    tuneMode: plan.config.tuneMode,
    season: plan.config.season,
    surface: plan.config.surface,
    carClass: plan.config.targetClass,
    pi: plan.config.targetPi,
    tireCompound: compound ?? input.tireCompound,
    hasAero: capabilities.aero,
    includeGearing: capabilities.gearing !== "none",
    capabilities,
    buildGuide: applied,
  };
}
