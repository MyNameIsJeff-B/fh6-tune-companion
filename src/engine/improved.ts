import type {
  Capability,
  TuneInput,
  TuneResult,
  TuneSection,
  TuneValue,
} from "../domain/types";
import { calculateBaseline } from "./baseline";
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

  if (input.unitSystem === "metric") {
    change(result.sections, "spring-front", (v) => v / 9, 0.66);
    change(result.sections, "spring-rear", (v) => v / 9, 0.66);
    const springSection = result.sections.find((section) => section.id === "springs");
    if (springSection) {
      const front = springSection.values.find((item) => item.key === "spring-front");
      const rear = springSection.values.find((item) => item.key === "spring-rear");
      springSection.summary =
        front && rear ? `${front.value} / ${rear.value} N/mm` : springSection.summary;
    }
    corrections.push(
      "TuneLabs omstreden 9× metrische veerschaal genormaliseerd; controleer altijd het in-game sliderbereik.",
    );
  }

  if (input.driveType === "RWD" && input.tuneMode !== "Drift") {
    change(result.sections, "diff-rear-accel", (v) => Math.min(v, 65), 0.8);
    corrections.push("RWD acceleratieslot begrensd om snap-overstuur en wielspin te verminderen.");
  }

  if (input.driveType === "FWD" && ["Race", "Touge", "General"].includes(input.tuneMode)) {
    change(result.sections, "diff-front-accel", (v) => Math.min(v, 75), 0.76);
    corrections.push("FWD acceleratieslot iets geopend voor minder exit-onderstuur.");
  }

  if (input.tireCompound === "Rally" && input.surface !== "Road") {
    change(result.sections, "pressure-front", (v) => v - (input.unitSystem === "metric" ? 0.25 : 3.5), 0.8);
    change(result.sections, "pressure-rear", (v) => v - (input.unitSystem === "metric" ? 0.25 : 3.5), 0.8);
    corrections.push("Rallybandenspanning verlaagd voor losse ondergrond.");
  }

  if (input.tuneMode === "Drag") {
    change(result.sections, "pressure-front", () => (input.unitSystem === "metric" ? 3.45 : 50), 0.72);
    change(result.sections, "pressure-rear", (v) => Math.min(v, input.unitSystem === "metric" ? 1.45 : 21), 0.74);
    corrections.push("Dragbanden aangepast naar lagere achterdruk en lagere rolweerstand voor.");
  }

  if (input.feelStability > 60) {
    change(result.sections, "arb-rear", (v) => Math.max(1, v - (input.feelStability - 60) * 0.18), 0.74);
    change(result.sections, "toe-rear", (v) => Math.max(v, 0.1), 0.75);
    corrections.push("Stabiliteitsvoorkeur toegepast op achter-ARB en toe.");
  }

  if (!input.weight || input.weight <= 0) {
    warnings.push("Gewicht ontbreekt: veren en demping zijn niet betrouwbaar.");
    for (const id of ["springs", "damping"] as Capability[]) {
      const section = result.sections.find((item) => item.id === id);
      section?.values.forEach((item) => (item.confidence = 0.25));
    }
  }
  if (!input.frontWeightPercent || input.frontWeightPercent < 30 || input.frontWeightPercent > 70) {
    warnings.push("Gewichtsverdeling is onzeker: rembalans en veren zijn benaderingen.");
  }
  if (input.inputMode === "quick") {
    warnings.push("Quick gebruikt standaardwaarden voor RPM, bandenmaat en topsnelheid.");
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
