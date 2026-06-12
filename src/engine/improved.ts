import type {
  Capability,
  TuneInput,
  TuneResult,
  TuneSection,
  TuneValue,
} from "../domain/types";
import {
  calculateBaseline,
  isValidSpringSliderRange,
  ROAD_ARB_RANGES,
} from "./baseline";
import { refreshSectionSummaries } from "./summaries";

const copy = <T,>(value: T): T => structuredClone(value);
const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

const capabilityAvailable = (input: TuneInput, id: Capability) => {
  if (id === "gearing") return input.capabilities.gearing !== "none";
  if (id === "differential") {
    return ![false, "none"].includes(input.capabilities.differential);
  }
  return Boolean(input.capabilities[id]);
};

const numeric = (item: TuneValue) =>
  typeof item.value === "number" ? item.value : Number(item.value);

const change = (
  sections: TuneSection[],
  key: string,
  transform: (value: number) => number,
  confidence?: number,
) => {
  for (const section of sections) {
    const item = section.values.find((candidate) => candidate.key === key);
    if (!item || Number.isNaN(numeric(item))) continue;
    item.value = round(transform(numeric(item)), 2);
    item.source = "improved";
    if (confidence) item.confidence = confidence;
  }
};

const replace = (
  sections: TuneSection[],
  key: string,
  amount: number | string,
  confidence = 0.76,
) => {
  for (const section of sections) {
    const item = section.values.find((candidate) => candidate.key === key);
    if (!item) continue;
    item.value = amount;
    item.source = "improved";
    item.confidence = confidence;
  }
};

export function calculateImproved(input: TuneInput): TuneResult {
  const baseline = calculateBaseline(input);
  const result = copy(baseline);
  const corrections: string[] = [];
  const warnings: string[] = [];

  change(result.sections, "bump-front", (v) => v * (0.35 / 0.52), 0.78);
  change(result.sections, "bump-rear", (v) => v * (0.35 / 0.52), 0.78);

  if (
    input.surface === "Road" &&
    !["Drift", "Rally"].includes(input.tuneMode)
  ) {
    corrections.push(
      "Bump blijft volgens forza.guide maximaal 50% van rebound als conservatieve FH6-baseline.",
    );
  }

  if (input.tuneMode === "Race" || input.tuneMode === "Touge") {
    change(result.sections, "bump-front", (v) => v * 0.88, 0.78);
    change(result.sections, "bump-rear", (v) => v * 0.88, 0.78);
    corrections.push(
      "Bump verlaagd tot ruim onder rebound volgens de 30-55%-band van forza.guide.",
    );
  }

  if (input.surface === "Road" && input.tuneMode !== "Drift") {
    change(result.sections, "toe-front", () => 0, 0.82);
    change(result.sections, "toe-rear", () => 0, 0.82);

    const camberTargets = ["Street", "Sport"].includes(input.tireCompound)
      ? { front: -1.2, rear: -0.7 }
      : input.tireCompound === "Race Slick"
        ? { front: -1.8, rear: -1 }
        : { front: -1.5, rear: -0.8 };
    change(result.sections, "camber-front", () => camberTargets.front, 0.78);
    change(result.sections, "camber-rear", () => camberTargets.rear, 0.78);
    corrections.push(
      "Road camber volgt de ForzaFire compound-band: milder op Street/Sport en agressiever op Race Slick.",
    );
  }

  corrections.push(
    isValidSpringSliderRange(input.springSliderRange)
      ? "Veren binnen de bevestigde in-game slidergrenzen berekend."
      : "Veren als veilig sliderpercentage getoond; exacte waarden wachten op in-game grenzen.",
  );

  if (input.driveType === "RWD" && input.tuneMode !== "Drift") {
    change(result.sections, "diff-rear-accel", (v) => Math.min(v, 65), 0.8);
    corrections.push("RWD acceleratieslot begrensd om snap-overstuur en wielspin te verminderen.");
  }

  if (input.driveType === "FWD" && ["Race", "Touge", "General"].includes(input.tuneMode)) {
    change(result.sections, "diff-front-accel", (v) => Math.min(v, 75), 0.76);
    corrections.push("FWD acceleratieslot iets geopend voor minder exit-onderstuur.");
  }

  if (input.tireCompound === "Off-Road" && input.surface !== "Road") {
    change(result.sections, "pressure-front", () => (input.unitSystem === "metric" ? 1.25 : 18), 0.8);
    change(result.sections, "pressure-rear", () => (input.unitSystem === "metric" ? 1.25 : 18), 0.8);
    corrections.push(
      "Off-Road tire pressure op 1,25 bar / 18 psi gezet volgens de forza.guide compound-band.",
    );
  } else if (input.tireCompound === "Rally" && input.surface !== "Road") {
    corrections.push(
      "Rally compound blijft rond de Street-pressure band; het is geen lage-pressure Off-Road tire.",
    );
  }

  if (input.tuneMode === "Drag") {
    change(result.sections, "pressure-front", () => (input.unitSystem === "metric" ? 3.45 : 50), 0.72);
    change(result.sections, "pressure-rear", (v) => Math.min(v, input.unitSystem === "metric" ? 1.45 : 21), 0.74);
    corrections.push("Dragbanden aangepast naar lagere achterdruk en lagere rolweerstand voor.");
    warnings.push(
      "Drag squat en suspension-keuze blijven build-afhankelijk; Rally suspension kan een startpunt zijn, maar valideer launch en wheeliegedrag in-game.",
    );
  }
  if (input.season === "Summer" && input.surface === "Road") {
    corrections.push(
      "Summer gebruikt volgens ForzaFire iets hogere tire pressure om warmteopbouw af te remmen.",
    );
  }
  if (input.season === "Winter" && input.surface !== "Snow") {
    corrections.push(
      "Winter gebruikt volgens de EZG-test en ForzaFire lagere tire pressure om koude tires sneller op temperatuur te brengen.",
    );
    warnings.push(
      "Winter verlaagt grip ook op droog asfalt: reken de eerste ronden op langere braking distances en kies een compound die echt op temperatuur komt.",
    );
  }

  if (input.feelStability > 60) {
    const specialMode =
      ["Drift", "Drag", "Rally", "Rain"].includes(input.tuneMode) ||
      ["Dirt", "Mixed", "Snow"].includes(input.surface);
    const rearMinimum = specialMode
      ? 1
      : ROAD_ARB_RANGES[input.driveType].rear[0];
    change(
      result.sections,
      "arb-rear",
      (v) => Math.max(rearMinimum, v - (input.feelStability - 60) * 0.18),
      0.74,
    );
    corrections.push("Stabiliteitsvoorkeur toegepast op de achter-ARB.");
  }

  const aeroSection = result.sections.find((section) => section.id === "aero");
  if (aeroSection && input.hasAero) {
    aeroSection.tip =
      input.tuneMode === "Wangan" || input.feelResponse < 45
        ? "Houd totale downforce laag voor topsnelheid en controleer in FH6 of Aero Balance rond 0,40-0,45 blijft."
        : "Gebruik meer totale downforce voor circuitgrip en controleer in FH6 of Aero Balance rond 0,40-0,45 blijft.";
  }

  if (input.tuneMode === "Touge") {
    warnings.push(
      "Touge vraagt snelle tire warm-up, korte gearing en weinig drag; op koude routes kan Sport sneller op temperatuur komen dan een theoretisch grippier compound.",
    );
    if (input.driveType === "RWD") {
      change(result.sections, "diff-rear-accel", () => 60, 0.7);
      change(result.sections, "diff-rear-decel", () => 30, 0.68);
      corrections.push(
        "Touge RWD differential gebruikt 60% acceleration en 30% deceleration als downhill-stabiliteitsstartpunt.",
      );
    }
  }

  if (input.tuneMode === "Wangan") {
    warnings.push(
      "Wangan gebruikt langere gearing, lage downforce en gelijkmatige gear spacing in de peak-power band; valideer topsnelheid met slipstream-marge.",
    );
  }

  if (
    input.driveType === "AWD" &&
    ["Race", "Touge", "Wangan", "General"].includes(input.tuneMode)
  ) {
    warnings.push(
      "FH6 AWD heeft een inherente understeer-bias; gebruik rear-biased differential en ARB-balans om die te compenseren.",
    );
  }

  if (!input.weight || input.weight <= 0) {
    warnings.push(
      "Gewicht ontbreekt: de koppel/gewicht-afhankelijke differential-inschatting is minder betrouwbaar.",
    );
    for (const id of ["differential"] as Capability[]) {
      const section = result.sections.find((item) => item.id === id);
      section?.values.forEach((item) => (item.confidence = 0.25));
    }
  }
  if (!input.frontWeightPercent || input.frontWeightPercent < 30 || input.frontWeightPercent > 70) {
    warnings.push("Gewichtsverdeling is onzeker: rembalans en ARB zijn benaderingen.");
  }
  if (!isValidSpringSliderRange(input.springSliderRange)) {
    warnings.push(
      input.springSliderRange
        ? "De veergrenzen zijn ongeldig: vul per as een maximum hoger dan het minimum in."
        : "Veergrenzen ontbreken: het advies toont alleen percentages van het in-game bereik.",
    );
  }
  if (
    input.tuneMode === "Rally" ||
    ["Dirt", "Mixed", "Snow"].includes(input.surface)
  ) {
    warnings.push(
      "Veerpercentages voor losse ondergrond zijn voorlopig een voorzichtige wegbaseline; valideer veerweg en sliderstand in FH6.",
    );
  }
  if (
    input.season === "Winter" &&
    input.surface !== "Snow" &&
    input.tireCompound === "Snow"
  ) {
    warnings.push(
      "Snow Tires zijn alleen geschikt wanneer het gekozen event echt sneeuw of ijs bevat.",
    );
  }
  if (
    ["Spring", "Autumn"].includes(input.season) &&
    input.surface === "Road" &&
    input.tireCompound === "Race Slick"
  ) {
    warnings.push(
      "Deze seasonal build kiest dry grip; schakel naar Race Semi-Slick wanneer de event forecast nat is.",
    );
  }
  if (input.surface === "Road") {
    warnings.push(
      "Forum-community-meta gebruikt soms circa 1,1 bar tire pressure; dit is onbevestigd en input-afhankelijk. Houd de berekende baseline aan en vergelijk tire temperatures via telemetry.",
    );
    warnings.push(
      "ForzaTune en forza.guide ondersteunen 0,0° front en rear toe als FH6-baseline; de juiste rear toe-in richting voor diagnose wacht nog op in-game bevestiging.",
    );
  }
  if (
    input.inputMode === "advanced" &&
    input.includeGearing &&
    input.redlineRpm > 0 &&
    input.topSpeed > 0 &&
    input.gears > 1
  ) {
    change(result.sections, "final-drive", (v) => Math.max(2.5, v * 0.97), 0.8);
    corrections.push(
      "Final Drive gebruikt de ForzaTune-methode met 3% RPM-marge onder de limiter.",
    );
  }

  const stuntType = input.buildGuide?.prStuntType;
  if (stuntType === "speed_trap") {
    const pressureStep = input.unitSystem === "metric" ? 0.1 : 1.5;
    change(result.sections, "pressure-front", (v) => v + pressureStep, 0.72);
    change(result.sections, "pressure-rear", (v) => v + pressureStep, 0.72);
    change(result.sections, "final-drive", (v) => Math.max(2.5, v * 0.92), 0.76);
    change(result.sections, "arb-rear", (v) => Math.max(1, v * 0.94), 0.7);
    replace(result.sections, "aero-front", "Minimum slider", 0.82);
    replace(result.sections, "aero-rear", "Minimum slider", 0.82);
    const gearing = result.sections.find((section) => section.id === "gearing");
    if (gearing) {
      gearing.tip =
        "Maak Final Drive zo lang mogelijk met duidelijke headroom boven de verwachte camerasnelheid.";
    }
    const aero = result.sections.find((section) => section.id === "aero");
    if (aero) {
      aero.tip = "Zet front en rear downforce op de minimum slider voor maximale top speed.";
    }
    corrections.push(
      "Speed Trap-variant: hogere tire pressure, minimale Aero, langere gearing en een stability-bias.",
    );
  }

  if (stuntType === "speed_zone") {
    change(result.sections, "final-drive", (v) => Math.max(2.5, v * 0.96), 0.76);
    const aero = result.sections.find((section) => section.id === "aero");
    if (aero) {
      aero.tip =
        "Behoud bruikbare downforce voor average speed en controleer Aero Balance rond 0,40-0,45.";
    }
    corrections.push(
      "Speed Zone-variant: Race-balance behouden met langere gearing en Aero Balance 0,40-0,45.",
    );
  }

  if (stuntType === "danger_sign") {
    change(result.sections, "bump-front", (v) => v * 0.82, 0.78);
    change(result.sections, "bump-rear", (v) => v * 0.82, 0.78);
    change(result.sections, "rebound-front", (v) => v * 0.92, 0.74);
    change(result.sections, "rebound-rear", (v) => v * 0.92, 0.74);
    const rideStep = input.unitSystem === "metric" ? 2.5 : 1;
    change(result.sections, "ride-front", (v) => v + rideStep, 0.68);
    change(result.sections, "ride-rear", (v) => v + rideStep, 0.68);
    change(result.sections, "final-drive", (v) => Math.max(2.5, v * 0.95), 0.72);
    replace(result.sections, "aero-front", "Minimum slider", 0.82);
    replace(result.sections, "aero-rear", "Minimum slider", 0.82);
    const damping = result.sections.find((section) => section.id === "damping");
    if (damping) {
      damping.tip =
        "Landing onrustig: verzacht eerst bump en verlaag daarna rebound licht; verander steeds een stap.";
    }
    corrections.push(
      "Jump-variant: bump verzacht, rebound licht verlaagd, ride height een stap verhoogd en Aero geminimaliseerd.",
    );
    warnings.push(
      "Ride height is een relatieve stap: klem op de echte in-game slidergrens en behoud voldoende suspension travel.",
    );
  }

  if (stuntType === "drift_zone") {
    warnings.push(
      "Drift Zone scoort alleen met RWD; zet Traction Control en Stability Control uit.",
    );
  }

  if (stuntType === "trailblazer") {
    const rideHeight = input.unitSystem === "metric" ? 17.8 : 7;
    replace(result.sections, "ride-front", rideHeight, 0.68);
    replace(result.sections, "ride-rear", rideHeight, 0.68);
    change(result.sections, "rebound-front", (v) => v + 2.2, 0.68);
    change(result.sections, "rebound-rear", (v) => v + 2.2, 0.68);
    change(result.sections, "final-drive", (v) => Math.min(6.5, v * 1.08), 0.72);
    for (const key of [
      "diff-front-accel",
      "diff-front-decel",
      "diff-rear-accel",
      "diff-rear-decel",
    ]) {
      change(result.sections, key, (v) => v * 0.9, 0.72);
    }
    replace(result.sections, "diff-center", 65, 0.76);
    const springs = result.sections.find((section) => section.id === "springs");
    if (springs) {
      springs.tip =
        "Trailblazer start rond 5-7 in ride height; behoud travel en pas de echte slidergrenzen in-game toe.";
    }
    corrections.push(
      "Trailblazer-variant: 7 in ride height, rebound +1,0 boven Race-richting, differential circa 10% opener, 65% rear center en kortere gearing.",
    );
  }

  if (input.inputMode === "quick") {
    warnings.push("Quick berekent geen gearing; kies Advanced en vul bevestigde RPM en topsnelheid in.");
  }
  if (input.ev || input.gears <= 1) {
    warnings.push(
      "EV/1-speed gearing gebruikt geen verbrandingsmotor-powerband; stel Final Drive in-game af op werkelijke topsnelheid en acceleration.",
    );
  }
  if (input.buildGuide && !input.buildGuide.valuesConfirmed) {
    warnings.push(
      "Build Guide gebruikt algemene upgradeprincipes: controleer de echte PI, het gewicht en de onderdeelbeschikbaarheid in FH6.",
    );
  }

  result.sections = result.sections.map((item) => {
    const available = capabilityAvailable(input, item.id);
    if (item.id === "gearing" && input.capabilities.gearing === "final") {
      item.values = item.values.filter((candidate) => candidate.key === "final-drive");
      item.summary = item.values.length ? `FD ${item.values[0].value}` : "Niet berekend";
    }
    if (
      item.id === "differential" &&
      input.capabilities.differential === "accel"
    ) {
      item.values = item.values.filter((candidate) =>
        candidate.key.endsWith("-accel"),
      );
    }
    return {
      ...item,
      available,
      unavailableReason: available
        ? undefined
        : item.id === "aero"
          ? "Geen verstelbare aero geïnstalleerd"
          : "Niet verstelbaar met deze build",
    };
  });
  result.sections = refreshSectionSummaries(result.sections, input.driveType);

  const visibleValues = result.sections
    .filter((item) => item.available)
    .flatMap((item) => item.values);
  const average =
    visibleValues.reduce((sum, item) => sum + item.confidence, 0) /
    Math.max(1, visibleValues.length);

  result.confidence = round(Math.max(0.35, average - warnings.length * 0.04), 2);
  result.warnings = warnings;
  result.corrections = corrections;
  result.techniqueTips = input.buildGuide?.techniqueTips;
  return result;
}
