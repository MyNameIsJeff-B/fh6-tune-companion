import {
  BASELINE_VERSION,
  CATALOG_VERSION,
  ENGINE_VERSION,
} from "../domain/defaults";
import type {
  Capability,
  DriveType,
  SpringSliderRange,
  TuneInput,
  TuneResult,
  TuneSection,
  TuneValue,
} from "../domain/types";

export const ROAD_ARB_RANGES: Record<
  DriveType,
  { front: [number, number]; rear: [number, number] }
> = {
  RWD: { front: [18, 25], rear: [25, 35] },
  AWD: { front: [22, 30], rear: [28, 38] },
  FWD: { front: [8, 15], rear: [25, 40] },
};

const SPRING_SLIDER_TARGETS = {
  sports: { front: 92.5, rear: 69 },
  highPerformance: { front: 89, rear: 73.5 },
  raceCar: { front: 88, rear: 72 },
} as const;

const labels: Record<Capability, string> = {
  tires: "Banden",
  gearing: "Overbrenging",
  alignment: "Uitlijning",
  arb: "Stabilisatorstangen",
  springs: "Veren",
  damping: "Demping",
  aero: "Aero",
  brakes: "Remmen",
  differential: "Differentieel",
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const round = (value: number, decimals = 1) =>
  Number(value.toFixed(decimals));

export const isValidSpringSliderRange = (
  range?: SpringSliderRange,
): range is SpringSliderRange &
  Required<Pick<SpringSliderRange, "frontMin" | "frontMax" | "rearMin" | "rearMax">> =>
  Boolean(
    range &&
      typeof range.frontMin === "number" &&
      typeof range.frontMax === "number" &&
      typeof range.rearMin === "number" &&
      typeof range.rearMax === "number" &&
      range.frontMin >= 0 &&
      range.rearMin >= 0 &&
      range.frontMax > range.frontMin &&
      range.rearMax > range.rearMin,
  );

export const getSpringSliderTargets = (input: TuneInput) => {
  const base = ["D", "C"].includes(input.carClass)
    ? SPRING_SLIDER_TARGETS.sports
    : ["B", "A"].includes(input.carClass)
      ? SPRING_SLIDER_TARGETS.highPerformance
      : SPRING_SLIDER_TARGETS.raceCar;
  return input.driveType === "FWD"
    ? { front: base.rear, rear: base.front }
    : { ...base };
};

const value = (
  key: string,
  label: string,
  amount: number | string,
  unit = "",
  confidence = 0.86,
): TuneValue => ({
  key,
  label,
  value: amount,
  unit,
  confidence,
  source: "tunelab",
});

const section = (
  id: Capability,
  values: TuneValue[],
  tip: string,
  summary: string,
): TuneSection => ({
  id,
  label: labels[id],
  values,
  tip,
  summary,
  available: true,
});

const parseTire = (spec: string) => {
  const [width = 275, aspect = 35, rim = 19] = spec
    .split(/[/R]/)
    .map(Number);
  const radiusMm = rim * 25.4 * 0.5 + width * (aspect / 100);
  return {
    width,
    aspect,
    rim,
    circumference: (2 * Math.PI * radiusMm) / 1000,
  };
};

export function calculateBaseline(input: TuneInput): TuneResult {
  const metric = input.unitSystem === "metric";
  const weightKg = metric ? input.weight : input.weight / 2.205;
  const speedKmh = metric ? input.topSpeed : input.topSpeed * 1.609;
  const torqueNm = metric ? input.maxTorque : input.maxTorque * 1.356;
  const frontPct = input.frontWeightPercent / 100;
  const is = (mode: TuneInput["tuneMode"]) => input.tuneMode === mode;
  const rally = is("Rally") || input.surface === "Dirt" || input.surface === "Mixed";
  const snow = input.surface === "Snow";
  const pwrToWeight = torqueNm / (weightKg / 1000);
  const pwrNorm = Math.min(1, pwrToWeight / 800);

  const springTargets = getSpringSliderTargets(input);
  const springRange = isValidSpringSliderRange(input.springSliderRange)
    ? input.springSliderRange
    : undefined;
  const validSpringRange = Boolean(springRange);
  const springUnit =
    input.springSliderRange?.unit ?? (metric ? "kgf/mm" : "lb/in");
  const interpolateSpring = (min: number, max: number, percent: number) =>
    round(min + (max - min) * (percent / 100), 2);
  const springFront: number | string = validSpringRange
    ? interpolateSpring(
        springRange!.frontMin,
        springRange!.frontMax,
        springTargets.front,
      )
    : `${springTargets.front}% van bereik`;
  const springRear: number | string = validSpringRange
    ? interpolateSpring(
        springRange!.rearMin,
        springRange!.rearMax,
        springTargets.rear,
      )
    : `${springTargets.rear}% van bereik`;

  const frontRideCm = is("Drift") ? 15.5 : rally ? 20 : snow ? 22 : 15;
  const rearRideCm = is("Drift") ? 15 : rally ? 19 : snow ? 21 : is("Drag") ? 17 : 15;

  const reboundRatio = (is("Drift") ? 0.7 : rally ? 0.6 : 0.7) * 1.1;
  const bumpRatio = (is("Drift") ? 0.45 : rally ? 0.42 : 0.52) * 1.1;
  const responseMod = 1.1 * (1 + (input.feelResponse - 50) / 200);
  const reboundFront = round(clamp(reboundRatio * 10 * responseMod, 1, 20));
  const reboundRear = round(clamp(reboundRatio * 10 * responseMod, 1, 20));
  const bumpFront = round(clamp(bumpRatio * 10 * responseMod, 1, 20));
  const bumpRear = round(clamp(bumpRatio * 10 * responseMod, 1, 20));

  let arbFront = 15;
  let arbRear = 50;
  if (is("Drift")) {
    arbFront = 10 + (input.feelResponse / 100) * 8;
    arbRear = 28 + (input.feelResponse / 100) * 20;
  } else if (is("Drag")) {
    arbFront = input.driveType === "RWD" ? 35 : input.driveType === "AWD" ? 30 : 40;
    arbRear = input.driveType === "RWD" ? 50 : input.driveType === "AWD" ? 45 : 40;
  } else if (rally) {
    arbFront = input.driveType === "FWD" ? 10 : 8;
    arbRear = input.driveType === "FWD" ? 18 : input.driveType === "AWD" ? 20 : 22;
  } else if (is("Rain") || snow) {
    arbFront = input.driveType === "FWD" ? 8 : 5;
    arbRear = input.driveType === "FWD" ? 18 : 12;
  } else {
    const ranges = ROAD_ARB_RANGES[input.driveType];
    const frontMid = (ranges.front[0] + ranges.front[1]) / 2;
    const rearMid = (ranges.rear[0] + ranges.rear[1]) / 2;
    const weightBias = clamp((input.frontWeightPercent - 50) / 20, -1, 1);
    const responseBias = (input.feelResponse - 50) / 20;
    arbFront =
      frontMid +
      weightBias * ((ranges.front[1] - ranges.front[0]) / 2) -
      responseBias;
    arbRear =
      rearMid -
      weightBias * ((ranges.rear[1] - ranges.rear[0]) / 2) +
      responseBias;
    arbFront = clamp(arbFront, ranges.front[0], ranges.front[1]);
    arbRear = clamp(arbRear, ranges.rear[0], ranges.rear[1]);
  }
  arbFront = round(clamp(arbFront, 1, 65));
  arbRear = round(clamp(arbRear, 1, 65));

  let camberFront = is("Drag") ? 0 : snow ? -0.5 : is("Rain") ? -0.8 : is("Drift") ? -2.5 : rally ? -1 : -1.5;
  let camberRear = is("Drag") ? 0 : snow ? -0.3 : is("Rain") ? -0.5 : is("Drift") ? -1.2 : rally ? -0.8 : -1;
  if (input.driveType === "FWD") {
    camberFront = Math.max(camberFront - 0.2, -2);
    camberRear = Math.min(camberRear + 0.3, -0.2);
  } else if (input.driveType === "RWD") {
    camberFront = Math.max(camberFront - 0.3, -2);
  } else {
    const average = (camberFront + camberRear) / 2;
    camberFront = round(average - 0.1);
    camberRear = round(average + 0.1);
  }
  const toeFront = is("Drag") ? 0 : is("Drift") ? 0.2 : rally ? 0 : -0.1;
  const toeRear = is("Drag") ? 0 : is("Drift") ? -0.2 : rally ? 0.1 : input.driveType === "FWD" ? 0.2 : 0.1;
  const caster = snow ? 5.5 : is("Drift") ? 6.5 : is("Drag") ? 6 : 7;

  const pressureUnit = metric ? "bar" : "psi";
  let pressureFront = metric ? 1.85 : 26.5;
  let pressureRear = pressureFront;
  if (is("Rain") || snow) pressureFront = pressureRear = metric ? 1.75 : 25.5;
  if (rally) pressureFront = pressureRear = metric ? 1.95 : 28.5;
  if (is("Drag")) {
    pressureFront = metric ? 2 : 29;
    pressureRear = metric ? 1.55 : 22.5;
  }
  if (is("Drift")) {
    pressureFront = metric ? 2.15 : 31;
    pressureRear = metric ? 2 : 29;
  }
  if (["Race Slick", "Race Semi-Slick"].includes(input.tireCompound)) {
    pressureFront += metric ? 0.1 : 1.5;
    pressureRear += metric ? 0.05 : 0.8;
  }
  if (input.tireCompound === "Street") {
    pressureFront -= metric ? 0.1 : 1.5;
    pressureRear -= metric ? 0.1 : 1.5;
  }
  if (input.tireCompound === "Off-Road") {
    pressureFront -= metric ? 0.4 : 5.8;
    pressureRear -= metric ? 0.4 : 5.8;
  }
  if (input.tireCompound === "Snow") {
    pressureFront -= metric ? 0.2 : 3;
    pressureRear -= metric ? 0.2 : 3;
  }
  if (input.surface !== "Snow" && input.tuneMode !== "Drag") {
    const seasonalDelta =
      input.season === "Summer"
        ? metric
          ? 0.05
          : 0.7
        : input.season === "Winter"
          ? metric
            ? -0.1
            : -1.5
          : 0;
    pressureFront += seasonalDelta;
    pressureRear += seasonalDelta;
  }
  pressureFront = round(pressureFront, metric ? 2 : 1);
  pressureRear = round(pressureRear, metric ? 2 : 1);

  let brakeBalance = is("Drift") ? 46 : is("Drag") ? 54 : is("Rain") || snow ? 52 : rally ? 54 : 56;
  brakeBalance += Math.round((frontPct - 0.5) * 20);
  if (input.driveType === "FWD") brakeBalance += 4;
  if (input.driveType === "RWD") brakeBalance -= 3;
  brakeBalance = clamp(brakeBalance, 40, 65);
  const brakePressure = is("Drift") ? 85 : is("Drag") ? 115 : is("Rain") || snow || rally ? 95 : 100;

  let frontAccel = 0;
  let frontDecel = 0;
  let rearAccel = 0;
  let rearDecel = 0;
  let center = 0;
  if (input.driveType === "FWD") {
    frontAccel = is("Drift") ? 80 : is("Drag") ? 85 : rally ? 65 : 85;
    frontDecel = is("Drag") ? 5 : rally ? 10 : 0;
  } else if (input.driveType === "RWD") {
    rearAccel = is("Drift") ? 100 : is("Drag") ? 90 : rally ? 60 : Math.round(55 + pwrNorm * 20);
    rearDecel = is("Drift") ? 10 : is("Drag") ? 5 : rally ? 20 : Math.round(10 + pwrNorm * 8);
  } else {
    frontAccel = is("Drift") ? 30 : is("Drag") ? 15 : rally ? 65 : 85;
    frontDecel = is("Drag") || rally ? 5 : 0;
    rearAccel = is("Drift") ? 85 : is("Drag") ? 90 : rally ? 70 : Math.round(55 + pwrNorm * 20);
    rearDecel = is("Drift") ? 10 : is("Drag") ? 5 : rally ? 15 : Math.round(10 + pwrNorm * 5);
    center = is("Drift") ? 50 : is("Drag") ? 20 : rally ? 55 : Math.round(70 + pwrNorm * 8);
  }

  let gearingValues: TuneValue[] = [];
  if (
    input.inputMode === "advanced" &&
    input.includeGearing &&
    input.redlineRpm > 0 &&
    input.topSpeed > 0 &&
    input.gears > 1
  ) {
    const tire = parseTire(input.tireRear);
    const topKmh = speedKmh;
    const rawFinal = (input.redlineRpm * tire.circumference * 3.6) / (topKmh * 60);
    const finalDrive = round(clamp(rawFinal, 2.5, 6.5), 2);
    const first = input.driveType === "AWD" ? 2.5 : input.driveType === "FWD" ? 2.8 : 2.2;
    const lastRaw = ((topKmh * 60) / (input.redlineRpm * tire.circumference * 3.6)) * finalDrive;
    const last = round(clamp(lastRaw, 0.75, 1.1), 2);
    const step = Math.pow(last / first, 1 / (input.gears - 1));
    gearingValues = [
      value("final-drive", "Eindoverbrenging", finalDrive, "", 0.78),
      ...Array.from({ length: input.gears }, (_, index) =>
        value(
          `gear-${index + 1}`,
          `${index + 1}e versnelling`,
          round(first * Math.pow(step, index), 2),
          "",
          0.72,
        ),
      ),
    ];
  }

  const sections: TuneSection[] = [
    section(
      "tires",
      [
        value("pressure-front", "Bandenspanning voor", pressureFront, pressureUnit),
        value("pressure-rear", "Bandenspanning achter", pressureRear, pressureUnit),
        value("compound", "Samenstelling", input.tireCompound),
        value("width-front", "Bandenmaat voor", input.tireFront),
        value("width-rear", "Bandenmaat achter", input.tireRear),
      ],
      "Controleer warme bandenspanning na enkele ronden en pas in kleine stappen aan.",
      `${pressureFront} / ${pressureRear} ${pressureUnit}`,
    ),
    section(
      "gearing",
      gearingValues,
      "Stem de hoogste versnelling af op de langste rechte lijn; de berekening houdt 3% marge onder de limiter.",
      gearingValues.length ? `FD ${gearingValues[0].value}` : "Niet berekend",
    ),
    section(
      "alignment",
      [
        value("camber-front", "Camber voor", round(camberFront), "°"),
        value("camber-rear", "Camber achter", round(camberRear), "°"),
        value("toe-front", "Toe voor", round(toeFront), "°"),
        value("toe-rear", "Toe achter", round(toeRear), "°"),
        value("caster", "Caster", caster, "°"),
      ],
      "Verander camber in stappen van 0,2°. Houd toe standaard op 0,0°; gebruik caster voordat front camber verder dan -2,0° gaat.",
      `${round(camberFront)}° / ${round(camberRear)}°`,
    ),
    section(
      "arb",
      [
        value("arb-front", "Voor", arbFront),
        value("arb-rear", "Achter", arbRear),
      ],
      "Onderstuur: voorzijde zachter. Instabiele achterkant: achterzijde zachter. Controleer in FH6 of Mechanical Balance binnen 0,55-0,65 blijft.",
      `${arbFront} / ${arbRear}`,
    ),
    section(
      "springs",
      [
        value(
          "spring-front",
          `Veer voor (${springTargets.front}%)`,
          springFront,
          validSpringRange ? springUnit : "",
          validSpringRange ? 0.78 : 0.5,
        ),
        value(
          "spring-rear",
          `Veer achter (${springTargets.rear}%)`,
          springRear,
          validSpringRange ? springUnit : "",
          validSpringRange ? 0.78 : 0.5,
        ),
        value("ride-front", "Rijhoogte voor", metric ? frontRideCm : round(frontRideCm / 2.54), metric ? "cm" : "in", 0.62),
        value("ride-rear", "Rijhoogte achter", metric ? rearRideCm : round(rearRideCm / 2.54), metric ? "cm" : "in", 0.62),
      ],
      rally
        ? "De percentages zijn een voorzichtige start; vrije veerweg blijft belangrijker op losse ondergrond."
        : validSpringRange
          ? "Berekend binnen het bevestigde in-game sliderbereik."
          : "Vul de vier in-game slidergrenzen in voor exacte veerwaarden.",
      validSpringRange
        ? `${springFront} / ${springRear} ${springUnit} · ${springTargets.front}% / ${springTargets.rear}%`
        : `${springTargets.front}% / ${springTargets.rear}% van bereik`,
    ),
    section(
      "damping",
      [
        value("rebound-front", "Rebound voor", reboundFront),
        value("rebound-rear", "Rebound achter", reboundRear),
        value("bump-front", "Bump voor", bumpFront),
        value("bump-rear", "Bump achter", bumpRear),
      ],
      "Bump hoort duidelijk lager te blijven dan rebound.",
      `R ${reboundFront}/${reboundRear} · B ${bumpFront}/${bumpRear}`,
    ),
    section(
      "aero",
      input.hasAero
        ? [
            value("aero-front", "Downforce voor", input.aeroFront, "kg", 0.64),
            value("aero-rear", "Downforce achter", input.aeroRear, "kg", 0.64),
            value("drag", "Luchtweerstand Cd", input.dragCoefficient, "", 0.55),
          ]
        : [],
      "Verhoog eerst achteraero wanneer de auto op hoge snelheid los aanvoelt.",
      input.hasAero ? `${input.aeroFront} / ${input.aeroRear} kg` : "Niet geïnstalleerd",
    ),
    section(
      "brakes",
      [
        value("brake-balance", "Balans", brakeBalance, "% voor"),
        value("brake-pressure", "Remdruk", brakePressure, "%"),
      ],
      "Pas balans aan op blokkeren of instabiliteit, niet op voorkeur alleen.",
      `${brakeBalance}% / ${brakePressure}%`,
    ),
    section(
      "differential",
      input.driveType === "FWD"
        ? [
            value("diff-front-accel", "Voor acceleratie", frontAccel, "%"),
            value("diff-front-decel", "Voor vertraging", frontDecel, "%"),
          ]
        : input.driveType === "RWD"
          ? [
              value("diff-rear-accel", "Achter acceleratie", rearAccel, "%"),
              value("diff-rear-decel", "Achter vertraging", rearDecel, "%"),
            ]
          : [
              value("diff-front-accel", "Voor acceleratie", frontAccel, "%"),
              value("diff-front-decel", "Voor vertraging", frontDecel, "%"),
              value("diff-rear-accel", "Achter acceleratie", rearAccel, "%"),
              value("diff-rear-decel", "Achter vertraging", rearDecel, "%"),
              value("diff-center", "Koppel naar achter", center, "%"),
            ],
      "Acceleratie beïnvloedt bochtuitgang; vertraging beïnvloedt insturen en lift-off.",
      input.driveType === "AWD"
        ? `${frontAccel}% / ${rearAccel}% / ${center}%`
        : `${input.driveType === "FWD" ? frontAccel : rearAccel}% accel`,
    ),
  ];

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    baselineVersion: BASELINE_VERSION,
    catalogVersion: CATALOG_VERSION,
    input,
    sections,
    confidence: 0.82,
    warnings: [],
    corrections: [],
  };
}
