import type {
  BuildCapabilities,
  DriveType,
  TuneInput,
} from "../domain/types";
import type {
  AppliedBuildGuide,
  BuildGuideConfig,
  BuildPlan,
  BuildPriority,
  BuildStage,
  BuildUpgrade,
  BuildUpgradeId,
} from "./types";

export const BUILD_GUIDE_VERSION = "build-guide-0.2.0";

export const CLASS_CAPS: Record<string, number> = {
  D: 500,
  C: 600,
  B: 700,
  A: 800,
  S1: 900,
  S2: 998,
  X: 999,
};

const source = ["forzatune-guide", "quicktune-guide", "optn", "in-game"];

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
): Pick<BuildUpgrade, "id" | "name" | "tireCompound" | "detail"> => {
  if (config.surface === "Snow") {
    return {
      id: "snow-tires",
      name: "Snow compound",
      tireCompound: "Snow",
      detail: "Grip op sneeuw gaat vóór extra vermogen.",
    };
  }
  if (config.tuneMode === "Drag") {
    return {
      id: "drag-tires",
      name: "Drag compound",
      tireCompound: "Drag",
      detail: "Maximaliseer tractie bij de launch.",
    };
  }
  if (config.tuneMode === "Drift") {
    return {
      id: "drift-tires",
      name: "Drift compound",
      tireCompound: "Drift",
      detail: "Voorspelbare sliphoek en temperatuur.",
    };
  }
  if (config.surface === "Dirt" || config.surface === "Mixed" || config.tuneMode === "Rally") {
    return {
      id: "rally-tires",
      name: "Rally compound",
      tireCompound: "Rally",
      detail: "Losse ondergrond vraagt eerst om de juiste band.",
    };
  }
  if (["D", "C"].includes(config.targetClass)) {
    return {
      id: "street-tires",
      name: "Street compound",
      tireCompound: "Street",
      detail: "Behoud PI voor gewicht en balans; voorkom over-tyring.",
    };
  }
  if (config.targetClass === "B") {
    return {
      id: "sport-tires",
      name: "Sport compound",
      tireCompound: "Sport",
      detail: "Sterke gripwinst zonder het hele PI-budget op te eten.",
    };
  }
  if (["A", "S1"].includes(config.targetClass)) {
    return {
      id: "semi-slick-tires",
      name: "Race semi-slick",
      tireCompound: "Race Semi-Slick",
      detail: "Geschikt startpunt voor snelle weg- en circuitbuilds.",
    };
  }
  return {
    id: "slick-tires",
    name: "Race slick",
    tireCompound: "Race Slick",
    detail: "Hoge klasse en snelheid vragen om maximale asfaltgrip.",
  };
};

const widthUpgrade = (driveType: DriveType): BuildUpgrade => {
  if (driveType === "FWD") {
    return upgrade(
      "front-width",
      "Voorbanden eerst verbreden",
      "De vooras stuurt én brengt vermogen over. Vergroot achter alleen als balans of PI dat vraagt.",
      "recommend",
      { confidence: 0.78 },
    );
  }
  if (driveType === "RWD") {
    return upgrade(
      "rear-width",
      "Achterbanden eerst verbreden",
      "Meer tractie uit bochten; voeg voorbreedte toe als turn-in of remgrip tekortschiet.",
      "recommend",
      { confidence: 0.78 },
    );
  }
  return upgrade(
    "balanced-width",
    "Breedte gebalanceerd verhogen",
    "AWD verdeelt de aandrijving; voorkom een extreem verschil tussen voor en achter.",
    "recommend",
    { confidence: 0.75 },
  );
};

const weightUpgrades = (targetClass: string): BuildUpgrade[] => {
  const items = [
    upgrade(
      "weight-1",
      "Gewichtsreductie Stage 1",
      "Verbetert remmen, acceleratie en richtingsverandering tegelijk.",
      "recommend",
      { confidence: 0.82, sourceIds: ["forzatune-guide", "optn", "in-game"] },
    ),
  ];
  if (["A", "S1", "S2", "X"].includes(targetClass)) {
    items.push(
      upgrade(
        "weight-2",
        "Gewichtsreductie Stage 2",
        "Neem deze als de PI-winst gunstiger blijft dan extra motorvermogen.",
        "recommend",
      ),
    );
  }
  if (["S1", "S2", "X"].includes(targetClass)) {
    items.push(
      upgrade(
        "weight-3",
        "Gewichtsreductie Stage 3",
        "Alleen kiezen als de auto niet te nerveus wordt en de PI-kosten kloppen.",
        "optional",
        { confidence: 0.62 },
      ),
    );
  }
  return items;
};

export function defaultBuildConfig(input: TuneInput): BuildGuideConfig {
  const saved = input.buildGuide;
  const targetClass =
    saved?.targetClass && saved.targetClass in CLASS_CAPS
      ? saved.targetClass
      : input.carClass in CLASS_CAPS
        ? input.carClass
        : "A";
  return {
    tuneMode: saved?.tuneMode ?? input.tuneMode,
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
): BuildPlan {
  const tire = tireChoice(config);
  const offroad =
    config.surface === "Dirt" ||
    config.surface === "Mixed" ||
    config.surface === "Snow" ||
    config.tuneMode === "Rally";
  const transmission =
    ["Drag", "Drift", "Wangan"].includes(config.tuneMode) ||
    ["acceleration", "speed"].includes(config.focus) ||
    ["S1", "S2", "X"].includes(config.targetClass)
      ? upgrade(
          "race-transmission",
          "Race transmission",
          "Volledige gearing is nuttig bij grote vermogens- of snelheidsverschillen.",
          "recommend",
          { capabilityPatch: { gearing: "full" }, confidence: 0.76 },
        )
      : upgrade(
          "sport-transmission",
          "Sport transmission",
          "Eindoverbrenging verstelbaar zonder onnodig veel complexiteit.",
          "recommend",
          { capabilityPatch: { gearing: "final" }, confidence: 0.76 },
        );

  const foundation = stage(
    "foundation",
    "Basis",
    "Ontgrendel eerst de goedkope, invloedrijke afstellingen.",
    "recommend",
    [
      upgrade(
        "differential",
        "Race differential",
        `${input.driveType}: tractie en bochtuitgang worden gericht afstelbaar.`,
        "recommend",
        { capabilityPatch: { differential: true }, confidence: 0.86 },
      ),
      transmission,
      upgrade(
        "arb",
        offroad ? "Verstelbare ARB" : "Race ARB voor & achter",
        offroad
          ? "Optioneel op losse ondergrond; te stijve stangen kosten onafhankelijk wielcontact."
          : "De snelste eerste correctie voor middenbochtbalans.",
        offroad ? "optional" : "recommend",
        { capabilityPatch: { arb: true }, confidence: 0.84 },
      ),
    ],
  );

  const tires = stage(
    "tires",
    "Banden",
    `${tire.name}; breedte volgt de aangedreven as en beschikbare PI.`,
    "recommend",
    [
      upgrade(tire.id, tire.name, tire.detail, "recommend", {
        capabilityPatch: { tires: true },
        tireCompound: tire.tireCompound,
        confidence: 0.78,
      }),
      widthUpgrade(input.driveType),
      ...(config.focus === "grip" && !offroad
        ? [
            upgrade(
              input.driveType === "RWD" ? "front-width" : "rear-width",
              input.driveType === "RWD"
                ? "Voorbreedte daarna finetunen"
                : "Achterbreedte daarna finetunen",
              "Voeg de tweede as alleen toe als de rondetijd of balans werkelijk verbetert.",
              "optional" as const,
              { confidence: 0.66, sourceIds: ["optn", "in-game"] },
            ),
          ]
        : []),
    ],
  );

  const suspensionId = config.tuneMode === "Drift"
    ? "drift-suspension"
    : offroad
      ? "rally-suspension"
      : "race-suspension";
  const suspensionName = config.tuneMode === "Drift"
    ? "Drift suspension"
    : offroad
      ? "Rally suspension"
      : "Race suspension";
  const chassis = stage(
    "chassis",
    "Remmen & onderstel",
    offroad
      ? "Veerweg en controle gaan vóór een lage rijhoogte."
      : "Voeg pas toe nadat banden, balans en gewicht zijn gekozen.",
    offroad ||
      config.focus === "control" ||
      ["S1", "S2", "X"].includes(config.targetClass)
      ? "recommend"
      : "optional",
    [
      upgrade(
        suspensionId,
        suspensionName,
        offroad
          ? "Meer veerweg en passende demping voor oneffen ondergrond."
          : "Ontgrendelt camber, veren, rijhoogte en demping.",
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
        "Race brakes",
        "Nuttiger voor zware, snelle auto's en circuits met harde remzones.",
        config.focus === "control" || ["S1", "S2", "X"].includes(config.targetClass)
          ? "recommend"
          : "optional",
        { capabilityPatch: { brakes: true }, confidence: 0.72 },
      ),
      upgrade(
        "chassis-reinforcement",
        "Chassis reinforcement",
        "Alleen als extra stabiliteit de gewichtstoename waard is.",
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
    "Vermogen",
    powerEarly
      ? "Vul het resterende PI-budget gericht voor acceleratie of topsnelheid."
      : "Voeg vermogen pas toe nadat de auto het kan benutten.",
    powerEarly ? "recommend" : "later",
    [
      upgrade(
        "power-light",
        "Lichte motorupgrades",
        config.keepStockEngine
          ? "Behoud het motorkarakter en voeg vermogen in kleine, meetbare stappen toe."
          : "Vergelijk elke stap op vermogen, gewicht en PI; meer pk is niet automatisch sneller.",
        powerEarly ? "recommend" : "later",
        { confidence: 0.68, sourceIds: ["quicktune-guide", "optn", "in-game"] },
      ),
      upgrade(
        "power-heavy",
        "Aspiratie- of engineswap",
        config.keepStockEngine
          ? "Overgeslagen: je wilt de standaardmotor behouden."
          : "Pas laat kiezen; controleer gewicht, balans, powerband en benodigde gearing opnieuw.",
        config.keepStockEngine ? "avoid" : "optional",
        { confidence: 0.52, sourceIds: ["quicktune-guide", "in-game"] },
      ),
    ],
  );

  const aeroUseful =
    !config.avoidAero &&
    !offroad &&
    config.tuneMode !== "Drag" &&
    ["A", "S1", "S2", "X"].includes(config.targetClass);
  const aero = stage(
    "aero",
    "Aero",
    aeroUseful
      ? "Gebruik downforce alleen als snelle bochten de topsnelheidsstraf waard zijn."
      : "Mechanische grip en een schone build hebben nu voorrang.",
    aeroUseful ? "optional" : "later",
    [
      upgrade(
        "front-aero",
        "Verstelbare front aero",
        "Helpt high-speed turn-in, maar kost topsnelheid en vaak PI.",
        aeroUseful ? "optional" : "later",
        { capabilityPatch: { aero: true }, confidence: 0.62 },
      ),
      upgrade(
        "rear-aero",
        "Verstelbare rear aero",
        "Geeft high-speed stabiliteit; voorkom een onnodig hoge stand.",
        aeroUseful ? "optional" : "later",
        { capabilityPatch: { aero: true }, confidence: 0.62 },
      ),
    ],
  );

  const warnings = [
    "Controleer per onderdeel de echte beschikbaarheid en PI-kosten in FH6.",
    "Voer na montage het werkelijke gewicht, de gewichtsverdeling en PI opnieuw in.",
  ];
  if (!config.keepStockDrivetrain) {
    warnings.push("Een drivetrain swap verandert de balans sterk; valideer de build als een nieuwe auto.");
  }
  if (config.targetPi < input.pi) {
    warnings.push("Het gekozen doel-PI ligt onder de huidige auto; verwijder eerst upgrades in FH6.");
  }

  return {
    version: BUILD_GUIDE_VERSION,
    config,
    driveType: input.driveType,
    currentPi: input.pi,
    piBudget: Math.max(0, config.targetPi - input.pi),
    confidence: Number(
      Math.max(0.48, 0.78 - (config.keepStockEngine ? 0 : 0.06) - (config.keepStockDrivetrain ? 0 : 0.08)).toFixed(2),
    ),
    warnings,
    stages: [foundation, tires, stage("weight", "Gewicht", "Minder massa helpt bijna elk prestatiedomein.", "recommend", weightUpgrades(config.targetClass)), chassis, power, aero],
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
