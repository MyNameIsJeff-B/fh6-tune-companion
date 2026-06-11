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

export function calculateImproved(input: TuneInput): TuneResult {
  const baseline = calculateBaseline(input);
  const result = copy(baseline);
  const corrections: string[] = [];
  const warnings: string[] = [];

  if (input.tuneMode === "Race" || input.tuneMode === "Touge") {
    change(result.sections, "bump-front", (v) => v * 0.88, 0.78);
    change(result.sections, "bump-rear", (v) => v * 0.88, 0.78);
    corrections.push("Bumpdemping verlaagd naar een rustiger FH6-startpunt.");
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

  if (["Rally", "Off-Road"].includes(input.tireCompound) && input.surface !== "Road") {
    change(result.sections, "pressure-front", (v) => v - (input.unitSystem === "metric" ? 0.25 : 3.5), 0.8);
    change(result.sections, "pressure-rear", (v) => v - (input.unitSystem === "metric" ? 0.25 : 3.5), 0.8);
    corrections.push("Offroad-bandenspanning verlaagd voor losse ondergrond.");
  }

  if (input.tuneMode === "Drag") {
    change(result.sections, "pressure-front", () => (input.unitSystem === "metric" ? 3.45 : 50), 0.72);
    change(result.sections, "pressure-rear", (v) => Math.min(v, input.unitSystem === "metric" ? 1.45 : 21), 0.74);
    corrections.push("Dragbanden aangepast naar lagere achterdruk en lagere rolweerstand voor.");
  }
  if (input.season === "Summer" && input.surface === "Road") {
    corrections.push(
      "Summer baseline uses slightly higher pressure to slow heat buildup.",
    );
  }
  if (input.season === "Winter" && input.surface !== "Snow") {
    corrections.push(
      "Winter baseline uses slightly lower pressure to help cold tires warm up.",
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
    change(result.sections, "toe-rear", (v) => Math.max(v, 0.1), 0.75);
    corrections.push("Stabiliteitsvoorkeur toegepast op achter-ARB en toe.");
  }

  if (!input.weight || input.weight <= 0) {
    warnings.push("Gewicht ontbreekt: demping is minder betrouwbaar.");
    for (const id of ["damping"] as Capability[]) {
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
      "Snow Tires are only appropriate when the selected event actually contains snow or ice.",
    );
  }
  if (
    ["Spring", "Autumn"].includes(input.season) &&
    input.surface === "Road" &&
    input.tireCompound === "Race Slick"
  ) {
    warnings.push(
      "This seasonal build prioritises dry grip; switch to Semi-Slick if the event forecast is wet.",
    );
  }
  if (input.inputMode === "quick") {
    warnings.push("Quick berekent geen gearing; kies Advanced en vul bevestigde RPM en topsnelheid in.");
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
  return result;
}
