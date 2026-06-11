import { DEFAULT_INPUT } from "../domain/defaults";
import type { DriveType, TuneMode } from "../domain/types";
import { calculateBaseline } from "./baseline";
import { applyDiagnosis } from "./diagnosis";
import { calculateImproved } from "./improved";
import {
  applyBuildPlan,
  defaultBuildConfig,
  defaultSelectedUpgrades,
  generateBuildPlan,
} from "../build-guide/engine";

describe("tuning engine", () => {
  it.each(["FWD", "RWD", "AWD"] satisfies DriveType[])(
    "calculates deterministic %s output",
    (driveType) => {
      const input = { ...DEFAULT_INPUT, id: "fixture", driveType };
      const first = calculateImproved(input);
      const second = calculateImproved(input);
      expect(first.sections).toEqual(second.sections);
    },
  );

  it.each([
    "Race",
    "Touge",
    "Wangan",
    "Drift",
    "Drag",
    "Rally",
    "General",
    "Rain",
  ] satisfies TuneMode[])("supports %s mode", (tuneMode) => {
    const result = calculateImproved({ ...DEFAULT_INPUT, tuneMode });
    expect(result.sections).toHaveLength(9);
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("never exposes unavailable settings", () => {
    const result = calculateImproved({
      ...DEFAULT_INPUT,
      capabilities: {
        ...DEFAULT_INPUT.capabilities,
        aero: false,
        springs: false,
        gearing: "none",
      },
    });
    expect(result.sections.find((item) => item.id === "aero")?.available).toBe(false);
    expect(result.sections.find((item) => item.id === "springs")?.available).toBe(false);
    expect(result.sections.find((item) => item.id === "gearing")?.available).toBe(false);
  });

  it("preserves the TuneLab baseline separately", () => {
    const baseline = calculateBaseline(DEFAULT_INPUT);
    const improved = calculateImproved(DEFAULT_INPUT);
    expect(baseline.corrections).toHaveLength(0);
    expect(improved.corrections.length).toBeGreaterThan(0);
    expect(baseline.baselineVersion).toBe("tunelab-1.7.0");
  });

  it.each([
    {
      name: "lichte RWD",
      input: { driveType: "RWD" as const, weight: 980, frontWeightPercent: 48 },
      front: [18, 25],
      rear: [25, 35],
    },
    {
      name: "zware AWD",
      input: { driveType: "AWD" as const, weight: 2100, frontWeightPercent: 58 },
      front: [22, 30],
      rear: [28, 38],
    },
    {
      name: "voor-zware FWD",
      input: { driveType: "FWD" as const, weight: 1450, frontWeightPercent: 64 },
      front: [8, 15],
      rear: [25, 40],
    },
  ])("keeps road ARB values inside published ranges for $name", ({ input, front, rear }) => {
    const result = calculateImproved({ ...DEFAULT_INPUT, ...input });
    const section = result.sections.find((item) => item.id === "arb");
    const frontValue = Number(
      section?.values.find((item) => item.key === "arb-front")?.value,
    );
    const rearValue = Number(
      section?.values.find((item) => item.key === "arb-rear")?.value,
    );
    expect(frontValue).toBeGreaterThanOrEqual(front[0]);
    expect(frontValue).toBeLessThanOrEqual(front[1]);
    expect(rearValue).toBeGreaterThanOrEqual(rear[0]);
    expect(rearValue).toBeLessThanOrEqual(rear[1]);
  });

  it("interpolates confirmed spring slider ranges in the literal game unit", () => {
    const result = calculateImproved({
      ...DEFAULT_INPUT,
      inputMode: "advanced",
      carClass: "A",
      springSliderRange: {
        frontMin: 100,
        frontMax: 300,
        rearMin: 80,
        rearMax: 280,
        unit: "kgf/mm",
      },
    });
    const springs = result.sections.find((item) => item.id === "springs");
    expect(springs?.values.find((item) => item.key === "spring-front")).toMatchObject({
      value: 278,
      unit: "kgf/mm",
    });
    expect(springs?.values.find((item) => item.key === "spring-rear")).toMatchObject({
      value: 227,
      unit: "kgf/mm",
    });
    expect(springs?.summary).toContain("89% / 73.5%");
  });

  it("swaps spring slider targets for FWD", () => {
    const result = calculateImproved({
      ...DEFAULT_INPUT,
      driveType: "FWD",
      carClass: "A",
      springSliderRange: {
        frontMin: 100,
        frontMax: 300,
        rearMin: 80,
        rearMax: 280,
        unit: "kgf/mm",
      },
    });
    const springs = result.sections.find((item) => item.id === "springs");
    expect(springs?.values.find((item) => item.key === "spring-front")?.value).toBe(
      247,
    );
    expect(springs?.values.find((item) => item.key === "spring-rear")?.value).toBe(
      258,
    );
  });

  it("shows percentages instead of an absolute spring guess without valid ranges", () => {
    const missing = calculateImproved(DEFAULT_INPUT);
    const missingFront = missing.sections
      .find((item) => item.id === "springs")
      ?.values.find((item) => item.key === "spring-front");
    expect(missingFront?.value).toBe("89% van bereik");
    expect(missingFront?.unit).toBe("");

    const invalid = calculateImproved({
      ...DEFAULT_INPUT,
      springSliderRange: {
        frontMin: 300,
        frontMax: 100,
        rearMin: 80,
        rearMax: 280,
        unit: "kgf/mm",
      },
    });
    expect(invalid.warnings.some((warning) => warning.includes("ongeldig"))).toBe(true);
  });

  it("only calculates gearing from advanced confirmed inputs", () => {
    const quick = calculateImproved({
      ...DEFAULT_INPUT,
      inputMode: "quick",
      includeGearing: true,
    });
    expect(
      quick.sections.find((item) => item.id === "gearing")?.values,
    ).toHaveLength(0);

    const advanced = calculateImproved({
      ...DEFAULT_INPUT,
      inputMode: "advanced",
      includeGearing: true,
      redlineRpm: 7800,
      topSpeed: 265,
    });
    expect(
      advanced.sections.find((item) => item.id === "gearing")?.values.length,
    ).toBeGreaterThan(1);
    expect(advanced.engineVersion).toBe("fh6-companion-0.3.0");
  });

  it("creates an immutable diagnosis revision", () => {
    const original = calculateImproved(DEFAULT_INPUT);
    const revised = applyDiagnosis(original, "power-oversteer");
    expect(revised.parentRevisionId).toBe(original.id);
    expect(revised.id).not.toBe(original.id);
    expect(original.revisionReason).toBeUndefined();
    expect(revised.revisionReason).toBe("Power-overstuur");
    const differential = revised.sections.find(
      (item) => item.id === "differential",
    );
    const rearAccel = differential?.values.find(
      (item) => item.key === "diff-rear-accel",
    )?.value;
    expect(differential?.summary).toBe(`${rearAccel}% accel`);
    expect(revised.sections.find((item) => item.id === "damping")?.summary).toContain(
      "5.46/4.96",
    );
  });

  it("lowers confidence when core data is missing", () => {
    const result = calculateImproved({ ...DEFAULT_INPUT, weight: 0 });
    expect(result.warnings.some((warning) => warning.includes("Gewicht"))).toBe(true);
    expect(result.confidence).toBeLessThan(0.8);
  });

  it("carries Build Guide uncertainty into the visible tune", () => {
    const plan = generateBuildPlan(DEFAULT_INPUT, defaultBuildConfig(DEFAULT_INPUT));
    const input = applyBuildPlan(
      DEFAULT_INPUT,
      plan,
      defaultSelectedUpgrades(plan),
    );
    const result = calculateImproved(input);
    expect(result.warnings.some((warning) => warning.includes("Build Guide"))).toBe(
      true,
    );
    expect(result.sections.find((section) => section.id === "aero")?.available).toBe(
      false,
    );

    const confirmed = calculateImproved({
      ...input,
      buildGuide: input.buildGuide
        ? { ...input.buildGuide, valuesConfirmed: true }
        : undefined,
    });
    expect(confirmed.warnings.some((warning) => warning.includes("Build Guide"))).toBe(
      false,
    );
  });
});
