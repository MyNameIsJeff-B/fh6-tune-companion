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
  PRStuntAdvice,
  PRStuntType,
  BuildStage,
  BuildUpgrade,
  BuildUpgradeId,
} from "./types";
import { seasonProfile } from "../domain/seasons";
import {
  BUILD_CLASS_OPTIONS,
  CLASS_CAPS,
  targetPiForClass,
} from "../domain/pi";

export const BUILD_GUIDE_VERSION = "build-guide-0.7.0";
export { BUILD_CLASS_OPTIONS, CLASS_CAPS };

const source = ["forzatune-guide", "quicktune-guide", "optn", "in-game"];
const CLASS_ORDER = ["D", "C", "B", "A", "S1", "S2", "R"];

export const PR_STUNT_OPTIONS: Array<{
  id: PRStuntType;
  label: string;
  sub: string;
}> = [
  { id: "speed_trap", label: "Speed Trap", sub: "Pure top speed" },
  { id: "speed_zone", label: "Speed Zone", sub: "Average speed + grip" },
  { id: "danger_sign", label: "Danger Sign", sub: "Launch + landing" },
  { id: "drift_zone", label: "Drift Zone", sub: "Angle + speed" },
  { id: "trailblazer", label: "Trailblazer", sub: "Open-terrain time" },
];

const PR_STUNT_ADVICE: Record<PRStuntType, PRStuntAdvice> = {
  speed_trap: {
    type: "speed_trap",
    label: "Speed Trap",
    summary: "Max power, minimale Aero en de langste bruikbare gearing.",
    techniqueTips: [
      "Neem 1-2 km run-up op de langste rechte aanloop.",
      "Gebruik drafting achter AI-verkeer en vlieg waar mogelijk downhill aan.",
      "Zet verkeer zo laag mogelijk en rem pas na de camera.",
    ],
    sourceIds: ["bossdown-pr-stunts", "gamingpromax-pr-stunts", "forzafire-aero"],
  },
  speed_zone: {
    type: "speed_zone",
    label: "Speed Zone",
    summary: "Road Race-grip met langere gearing en een speed-bias.",
    techniqueTips: [
      "Optimaliseer de gemiddelde snelheid: offer geen corner speed op voor alleen top speed.",
      "Gebruik een vloeiende lijn en rem vroeg genoeg om de volledige zone snelheid mee te nemen.",
      "Controleer Aero Balance rond 0,40-0,45 als verstelbare Aero aanwezig is.",
    ],
    sourceIds: ["bossdown-pr-stunts", "gamingpromax-pr-stunts", "game8-aero"],
  },
  danger_sign: {
    type: "danger_sign",
    label: "Danger Sign",
    summary: "Acceleration, rechte launch en landing-reserve gaan voor circuitbalans.",
    techniqueTips: [
      "Meet de run-up in wegsegmenten, niet in autolengtes.",
      "Raak de ramp volledig recht; een paar graden yaw kost veel afstand.",
      "Gebruik rewind wanneer verkeer de aanloop of launch verstoort.",
    ],
    sourceIds: ["bossdown-pr-stunts", "gamesgg-danger-signs", "fh6wiki-landing"],
  },
  drift_zone: {
    type: "drift_zone",
    label: "Drift Zone",
    summary: "Bestaande Drift-branch met een harde RWD- en assists-regel.",
    techniqueTips: [
      "RWD is verplicht voor score; AWD en FWD tellen niet mee.",
      "Schakel Traction Control en Stability Control uit.",
      "Bouw score met een constante slip angle en snelheid, niet met losse powerslides.",
    ],
    sourceIds: ["bossdown-pr-stunts", "gamingpromax-pr-stunts", "in-game"],
  },
  trailblazer: {
    type: "trailblazer",
    label: "Trailblazer",
    summary: "Cross Country-build met Off-Road Tires, travel en herstelacceleratie.",
    techniqueTips: [
      "Kies de snelste terreinlijn, niet automatisch de kortste rechte lijn.",
      "Vermijd bomen, diepe rivieren en harde compressies die alle momentum kosten.",
      "Gebruik korte gearing om na jumps en langzame secties direct te herstellen.",
    ],
    sourceIds: ["bossdown-pr-stunts", "gamingpromax-pr-stunts", "forzafire-aero"],
  },
};

export const getPRStuntAdvice = (type?: PRStuntType) =>
  type ? PR_STUNT_ADVICE[type] : undefined;

export const configForPRStunt = (
  config: BuildGuideConfig,
  type: PRStuntType,
): BuildGuideConfig => {
  const mapped: Record<
    PRStuntType,
    Pick<BuildGuideConfig, "tuneMode" | "surface" | "focus" | "avoidAero">
  > = {
    speed_trap: {
      tuneMode: "Wangan",
      surface: "Road",
      focus: "speed",
      avoidAero: true,
    },
    speed_zone: {
      tuneMode: "Race",
      surface: "Road",
      focus: "speed",
      avoidAero: false,
    },
    danger_sign: {
      tuneMode: "General",
      surface: "Road",
      focus: "acceleration",
      avoidAero: true,
    },
    drift_zone: {
      tuneMode: "Drift",
      surface: "Road",
      focus: "control",
      avoidAero: true,
    },
    trailblazer: {
      tuneMode: "Rally",
      surface: "Mixed",
      focus: "control",
      avoidAero: true,
    },
  };
  return {
    ...config,
    goal: "pr-stunt",
    prStuntType: type,
    ...mapped[type],
  };
};

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
  if (config.prStuntType === "trailblazer") {
    return {
      id: "offroad-tires",
      name: "Off-Road Tires",
      tireCompound: "Off-Road",
      detail: "Trailblazer vereist impactabsorptie en traction op open, ruw terrein.",
    };
  }
  if (config.surface === "Snow") {
    return {
      id: "snow-tires",
      name: "Snow compound",
      tireCompound: "Snow",
      detail: "Grip op sneeuw gaat voor extra power.",
    };
  }
  if (config.tuneMode === "Drag") {
    return {
      id: "drag-tires",
      name: "Drag compound",
      tireCompound: "Drag",
      detail: "Maximaliseer traction bij de launch.",
    };
  }
  if (config.tuneMode === "Drift") {
    return {
      id: "drift-tires",
      name: "Drift compound",
      tireCompound: "Drift",
      detail: "Geef prioriteit aan een voorspelbare slip angle en tire temperature.",
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
      detail: "Behoudt bruikbare wet-weather grip die Race Slicks niet bieden.",
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
      detail: "Cross Country vraagt impactabsorptie en traction op ruw terrein.",
    };
  }
  if (config.surface === "Dirt" || config.surface === "Mixed" || config.tuneMode === "Rally") {
    return {
      id: "rally-tires",
      name: "Rally compound",
      tireCompound: "Rally",
      detail: "Losse ondergrond vraagt eerst de juiste tire. Race Slicks en in mindere mate Sport/Semi-Slick verliezen in FH6 veel meer grip op dirt.",
    };
  }
  if (["D", "C"].includes(config.targetClass)) {
    return {
      id: "street-tires",
      name: "Street compound",
      tireCompound: "Street",
      detail: "Bewaar PI voor gewicht en balans; voorkom dat de auto te veel tire krijgt.",
    };
  }
  if (config.targetClass === "B") {
    return {
      id: "sport-tires",
      name: "Sport compound",
      tireCompound: "Sport",
      detail: "Sterke gripwinst zonder het volledige PI-budget uit te geven.",
    };
  }
  if (["A", "S1"].includes(config.targetClass)) {
    return {
      id: "semi-slick-tires",
      name: "Race semi-slick",
      tireCompound: "Race Semi-Slick",
      detail: "Een geschikt startpunt voor snelle Road- en circuitbuilds.",
    };
  }
  return {
    id: "slick-tires",
    name: "Race slick",
    tireCompound: "Race Slick",
    detail: "Hoge klassen en snelheid vragen maximale Road-grip.",
  };
};

const widthUpgrade = (driveType: DriveType): BuildUpgrade => {
  if (driveType === "FWD") {
    return upgrade(
      "front-width",
      "Front Tires eerst verbreden",
      "De vooras stuurt en brengt power over. Verbreed rear alleen wanneer balans of PI dat vraagt.",
      "recommend",
      { confidence: 0.78 },
    );
  }
  if (driveType === "RWD") {
    return upgrade(
      "rear-width",
      "Rear Tires eerst verbreden",
      "Verbetert traction bij corner exit. Voeg front width toe als turn-in of braking grip tekortschiet.",
      "recommend",
      { confidence: 0.78 },
    );
  }
  return upgrade(
    "balanced-width",
    "Tire Width gelijkmatig vergroten",
    "AWD verdeelt power over beide assen; voorkom een extreem verschil tussen front en rear.",
    "recommend",
    { confidence: 0.75 },
  );
};

const weightUpgrades = (targetClass: string): BuildUpgrade[] => {
  const items = [
    upgrade(
      "weight-1",
      "Weight Reduction Stage 1",
      "Verbetert braking, acceleration en richtingswisselingen tegelijk.",
      "recommend",
      { confidence: 0.82, sourceIds: ["forzatune-guide", "optn", "in-game"] },
    ),
  ];
  if (["A", "S1", "S2", "R", "X"].includes(targetClass)) {
    items.push(
      upgrade(
        "weight-2",
        "Weight Reduction Stage 2",
        "Kies dit zolang de PI-waarde beter blijft dan extra engine power.",
        "recommend",
      ),
    );
  }
  if (["S1", "S2", "R", "X"].includes(targetClass)) {
    items.push(
      upgrade(
        "weight-3",
        "Weight Reduction Stage 3",
        "Gebruik dit alleen als de auto niet nerveus wordt en de PI-kosten logisch blijven.",
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
    goal: saved?.goal ?? (saved?.prStuntType ? "pr-stunt" : "standard"),
    prStuntType: saved?.prStuntType,
    tuneMode: saved?.tuneMode ?? input.tuneMode,
    season: saved?.season ?? input.season ?? "Summer",
    surface: saved?.surface ?? input.surface,
    focus: saved?.focus ?? "balanced",
    targetClass,
    targetPi: targetPiForClass(targetClass, saved?.targetPi),
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
  const stuntAdvice =
    config.goal === "pr-stunt"
      ? getPRStuntAdvice(config.prStuntType ?? "speed_trap")
      : undefined;
  const stuntType = stuntAdvice?.type;
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
  const crossCountryProfile =
    profile?.preset === "cross_country_a_s1" || stuntType === "trailblazer";
  const fullDifferential =
    !["D", "C"].includes(config.targetClass) ||
    ["Drift", "Rally"].includes(config.tuneMode) ||
    offroad;
  const metricWeight =
    input.unitSystem === "metric" ? input.weight : input.weight / 2.205;
  const metricTorque =
    input.unitSystem === "metric" ? input.maxTorque : input.maxTorque * 1.356;
  const lightPowerfulRoadBuild =
    roadRace &&
    ["A", "S1"].includes(config.targetClass) &&
    metricWeight > 0 &&
    metricTorque / (metricWeight / 1000) >= 450;
  const transmission =
    ["Drag", "Drift", "Wangan"].includes(config.tuneMode) ||
    ["acceleration", "speed"].includes(config.focus) ||
    ["S1", "S2", "R", "X"].includes(config.targetClass)
      ? upgrade(
          "race-transmission",
          "Race Transmission",
          input.gears >= 8
            ? "Laat een goede factory transmission met 8+ gears meestal stock, tenzij de spacing aantoonbaar slecht is; Race kost ongeveer 2-8 PI meer dan Sport."
            : "Gebruik volledige gearing bij grote power-wijzigingen, ongebruikelijke stock spacing, Drag of Wangan; Race kost meestal ongeveer 2-8 PI meer dan Sport.",
          "recommend",
          { capabilityPatch: { gearing: "full" }, confidence: 0.76 },
        )
      : upgrade(
          "sport-transmission",
          "Sport Transmission",
          "De B/A sweet spot: verstelbare Final Drive zonder de gebruikelijke 2-8 PI-meerprijs van Race. Laat 8+ goed gespreide factory gears stock.",
          "recommend",
          { capabilityPatch: { gearing: "final" }, confidence: 0.76 },
        );
  const raceDifferential = upgrade(
    "differential",
    config.tuneMode === "Drift"
      ? "Drift Differential"
      : offroad
        ? crossCountryProfile
          ? "Off-Road Differential"
          : "Rally Differential"
        : "Race Differential",
    `${input.driveType}: ontgrendelt acceleration- en deceleration-tuning${input.driveType === "AWD" ? " plus center balance" : ""}. Bij sommige FH6-auto's kost dit een kleine hoeveelheid PI; controleer dat in-game.`,
    fullDifferential ? "recommend" : "optional",
    {
      capabilityPatch: { differential: "full" },
      confidence: 0.86,
      sourceIds: ["forzafire-drivetrain", "in-game"],
    },
  );
  const differentialUpgrades = fullDifferential
    ? [raceDifferential]
    : [
        upgrade(
          "sport-differential",
          "Sport Differential",
          `${input.driveType}: ontgrendelt alleen acceleration-tuning en bewaart meer PI in lagere klassen.`,
          "recommend",
          {
            capabilityPatch: { differential: "accel" },
            confidence: 0.8,
            sourceIds: ["forzafire-drivetrain", "in-game"],
          },
        ),
        raceDifferential,
      ];

  const foundation = stage(
    "foundation",
    "Basis",
    "Ontgrendel eerst de goedkope aanpassingen met veel invloed.",
    "recommend",
    [
      ...differentialUpgrades,
      transmission,
      upgrade(
        "arb",
        offroad ? "Adjustable Anti-Roll Bars" : "Race Front & Rear Anti-Roll Bars",
        offroad
          ? "Optioneel op losse ondergrond; te veel stijfheid vermindert onafhankelijk wielcontact."
          : "De snelste eerste correctie voor mid-corner balance.",
        offroad && !profileRequires("arb") ? "optional" : "recommend",
        { capabilityPatch: { arb: true }, confidence: 0.84 },
      ),
    ],
  );

  const tires = stage(
    "tires",
    "Tires",
    `${tire.name}; width volgt de aangedreven as en beschikbare PI.`,
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
      ...(input.driveType === "RWD" &&
      roadRace &&
      ["A", "S1", "S2", "R", "X"].includes(config.targetClass)
        ? [
            upgrade(
              "front-width",
              "Daarna Front Tire Width vergroten",
              "FH6 geeft front width meer voordeel bij braking en turn-in dan eerdere titels; voeg het na rear traction toe zolang de PI-kosten efficiënt blijven.",
              "recommend" as const,
              {
                confidence: 0.76,
                sourceIds: ["gamingpromax-handling", "in-game"],
              },
            ),
          ]
        : config.focus === "grip" && !offroad
        ? [
            upgrade(
              input.driveType === "RWD" ? "front-width" : "rear-width",
              input.driveType === "RWD"
                ? "Daarna Front Width finetunen"
                : "Daarna Rear Width finetunen",
              "Voeg alleen width aan de tweede as toe wanneer lap time of balance echt verbetert.",
              "optional" as const,
              { confidence: 0.66, sourceIds: ["optn", "in-game"] },
            ),
          ]
        : []),
      ...(lightPowerfulRoadBuild
        ? [
            upgrade(
              "rally-tires",
              "Rally Compound (PI-efficiënt alternatief)",
              "Een bruikbare A/S1 Road-optie voor lichte, krachtige auto's: grip kan voor minder PI dicht bij slicks komen. Tune tire pressure opnieuw en vergelijk lap time voordat je deze keuze behoudt.",
              "optional" as const,
              {
                capabilityPatch: { tires: true },
                tireCompound: "Rally",
                confidence: 0.66,
                sourceIds: ["forza-guide", "in-game"],
              },
            ),
          ]
        : []),
    ],
  );

  const suspensionId = config.tuneMode === "Drift"
    ? "drift-suspension"
    : offroad
      ? crossCountryProfile
        ? "offroad-suspension"
        : "rally-suspension"
      : "race-suspension";
  const suspensionName = config.tuneMode === "Drift"
    ? "Drift Suspension"
    : offroad
      ? crossCountryProfile
        ? "Off-Road Suspension"
        : "Rally Suspension"
      : "Race Suspension";
  const chassis = stage(
    "chassis",
    "Brakes & chassis",
    offroad
      ? "Suspension travel en controle gaan voor een lage ride height."
      : "Voeg dit toe nadat tires, balance en weight reduction zijn gekozen.",
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
          ? "Voegt suspension travel en geschikte damping toe voor oneffen terrein."
          : "Ontgrendelt camber, springs, ride height en damping.",
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
        "ForzaFire en GamingProMax melden dat FH6 Road-builds vanaf A-class sterk profiteren van consistente braking en minder lock-up; controleer de PI-kosten per auto.",
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
        config.tuneMode === "Drag"
          ? "Vermijd dit voor Drag: het voegt handling-gewicht toe zonder een straight-line run te verbeteren."
          : "Gebruik dit alleen wanneer de extra stabiliteit het extra gewicht waard is.",
        config.tuneMode === "Drag" ? "avoid" : "later",
        { confidence: 0.55, sourceIds: ["optn", "in-game"] },
      ),
    ],
  );

  const powerEarly =
    config.focus === "speed" ||
    config.focus === "acceleration" ||
    ["Drag", "Wangan"].includes(config.tuneMode) ||
    ["speed_trap", "danger_sign"].includes(stuntType ?? "");
  const power = stage(
    "power",
    "Power",
    powerEarly
      ? "Besteed het resterende PI-budget gericht aan acceleration of top speed."
      : "Voeg pas power toe wanneer de auto die ook kan benutten.",
    powerEarly ? "recommend" : "later",
    [
      upgrade(
        "power-light",
        "Light Engine Upgrades",
        config.keepStockEngine
          ? "Behoud het engine-karakter en voeg power toe in kleine, meetbare stappen."
          : "Vergelijk iedere stap op power, weight en PI; meer horsepower is niet automatisch sneller.",
        powerEarly ? "recommend" : "later",
        { confidence: 0.68, sourceIds: ["quicktune-guide", "optn", "in-game"] },
      ),
      upgrade(
        "power-heavy",
        "Aspiration or Engine Swap",
        config.keepStockEngine
          ? "Overgeslagen omdat de stock engine behouden blijft."
          : input.ev
            ? "Een EV motor/battery swap verandert instant torque, mass en balance. Vergelijk eerst het battery weight; vertrouw niet blind op een meta preset die nog verandert."
            : "Kies dit laat. Houd PI over voor tires, brakes en weight; tune gearing en differential opnieuw, vergelijk met de pre-swap baseline en verwijder de swap als het class target verloren gaat.",
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
    ["A", "S1", "S2", "R", "X"].includes(config.targetClass) &&
    !["speed_trap", "danger_sign", "trailblazer"].includes(stuntType ?? "");
  const aero = stage(
    "aero",
    "Aero",
    aeroUseful
      ? "Gebruik downforce alleen wanneer fast-corner grip de top-speed penalty waard is."
      : "Mechanical grip en een efficiënte build krijgen voorrang.",
    aeroUseful ? "optional" : "later",
    [
      upgrade(
        "front-aero",
        "Adjustable Front Aero",
        "Verbetert high-speed turn-in, maar kost top speed en vaak PI.",
        aeroUseful ? "optional" : profileAvoids("aero") ? "avoid" : "later",
        { capabilityPatch: { aero: true }, confidence: 0.62 },
      ),
      upgrade(
        "rear-aero",
        "Adjustable Rear Aero",
        "Voegt high-speed stability toe; vermijd een onnodig hoge instelling.",
        aeroUseful ? "optional" : profileAvoids("aero") ? "avoid" : "later",
        { capabilityPatch: { aero: true }, confidence: 0.62 },
      ),
      upgrade(
        "widebody",
        "Widebody Kit",
        "Kan front aero en bredere tires ontgrendelen, maar voegt weight, drag en PI toe. Sla dit over wanneer de extra tire width niet nodig is.",
        aeroUseful || config.focus === "grip" ? "optional" : "later",
        {
          confidence: 0.66,
          sourceIds: ["ggwtb-conversions", "in-game"],
        },
      ),
    ],
  );

  const warnings = [
    "Controleer in FH6 of de onderdelen beschikbaar zijn en wat ze werkelijk aan PI kosten.",
    "Vul na installatie het werkelijke weight, de weight distribution en PI in.",
  ];
  const season = seasonProfile(config.season);
  warnings.push(`${season.id}: ${season.guidance}`);
  if (!config.keepStockDrivetrain) {
    warnings.push("Een drivetrain swap verandert de balance aanzienlijk; valideer dit als een nieuwe build.");
    if (input.driveType === "AWD" && config.tuneMode !== "Drift") {
      warnings.push(
        "Factory AWD is in FH6 meestal het behouden waard; een RWD swap is vooral nuttig voor Drift of om het B/A chassis-gevoel te bewaren.",
      );
    } else if (
      input.driveType !== "AWD" &&
      ["D", "C"].includes(config.targetClass)
    ) {
      warnings.push(
        "Vermijd een AWD swap in D/C: de PI-kosten verbruiken meestal het budget dat nodig is voor tires, weight en brakes.",
      );
    } else if (input.driveType !== "AWD") {
      warnings.push(
        "Een AWD swap kan de consistentie in S1/S2, Dirt of Cross Country verbeteren, maar voegt inherent understeer toe dat met ARB- en differential-tuning moet worden gecompenseerd.",
      );
    }
  }
  if (config.tuneMode === "Drift") {
    warnings.push(
      "FH6 Drift Zones vereisen RWD voor de score; schakel Traction Control en Stability Control uit.",
    );
  }
  if (stuntType === "drift_zone" && input.driveType !== "RWD") {
    warnings.push(
      `${input.driveType} past niet bij Drift Zone: bouw of kies een RWD-auto voordat je op score rijdt.`,
    );
  }
  if (stuntType === "speed_trap" && input.hasAero) {
    warnings.push(
      "Speed Trap-mismatch: zet verstelbare front en rear Aero op minimum of verwijder zware race-aero als de PI elders meer oplevert.",
    );
  }
  if (stuntType === "speed_zone" && config.avoidAero) {
    warnings.push(
      "Speed Zone zonder bruikbare Aero kan average speed kosten; behoud high-speed grip en mik op Aero Balance 0,40-0,45.",
    );
  }
  if (stuntType === "trailblazer") {
    if (input.driveType !== "AWD") {
      warnings.push(
        `${input.driveType} is een mismatch voor Trailblazer; AWD is de betrouwbare keuze voor open terrein.`,
      );
    }
    if (input.tireCompound !== "Off-Road") {
      warnings.push(
        `De huidige ${input.tireCompound} build past niet bij Trailblazer; monteer Off-Road Tires en Off-Road Suspension.`,
      );
    }
  }
  if (stuntType === "danger_sign" && input.driveType !== "AWD") {
    warnings.push(
      `${input.driveType} kan werken, maar AWD is aanbevolen om de korte run-up zonder wheelspin te benutten.`,
    );
  }
  if (stuntType === "danger_sign" && input.hasAero) {
    warnings.push(
      "Danger Sign-mismatch: zet verstelbare Aero op minimum; extra downforce drukt het vliegtraject plat.",
    );
  }
  if (config.targetPi < input.pi) {
    warnings.push("De target PI ligt onder de huidige auto; verwijder eerst upgrades in FH6.");
  }
  const nativeClass = profile?.stockClass ?? input.carClass;
  const nativeClassIndex = CLASS_ORDER.indexOf(nativeClass === "X" ? "R" : nativeClass);
  const targetClassIndex = CLASS_ORDER.indexOf(
    config.targetClass === "X" ? "R" : config.targetClass,
  );
  if (nativeClassIndex >= 0 && targetClassIndex >= nativeClassIndex + 2) {
    warnings.push(
      `Community-onderzoek: target class ${config.targetClass} ligt minstens twee klassen boven native ${nativeClass}; auto's uit de native class gebruiken het PI-budget meestal efficiënter.`,
    );
  }
  if (profile?.risks.includes("needs_in_game_weight_for_exact_springs")) {
    warnings.push("Dit type auto vereist bevestigd in-game weight en spring ranges voor exacte springwaarden.");
  }

  const weight = stage(
    "weight",
    "Weight",
    "Minder massa verbetert bijna ieder prestatiegebied.",
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
  const stuntOrder: Record<PRStuntType, BuildStage["id"][]> = {
    speed_trap: ["power", "foundation", "tires", "aero", "chassis", "weight"],
    speed_zone: ["tires", "aero", "foundation", "chassis", "power", "weight"],
    danger_sign: ["power", "foundation", "tires", "chassis", "weight", "aero"],
    drift_zone: ["tires", "foundation", "chassis", "weight", "power", "aero"],
    trailblazer: ["tires", "chassis", "foundation", "weight", "power", "aero"],
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
    (stuntType ? stuntOrder[stuntType] : undefined) ??
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
    stuntAdvice,
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
    differential: "none",
  };

  for (const item of selectedUpgrades) {
    if (!item.capabilityPatch) continue;
    Object.assign(capabilities, item.capabilityPatch);
  }

  const compound = selectedUpgrades.find((item) => item.tireCompound)?.tireCompound;
  const applied: AppliedBuildGuide = {
    version: plan.version,
    goal: plan.config.goal,
    prStuntType: plan.config.prStuntType,
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
    techniqueTips: plan.stuntAdvice?.techniqueTips,
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
