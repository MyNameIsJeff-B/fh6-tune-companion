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

  it("normalises the disputed metric spring scale in improved advice", () => {
    const baseline = calculateBaseline(DEFAULT_INPUT);
    const improved = calculateImproved(DEFAULT_INPUT);
    const baselineSpring = baseline.sections
      .find((item) => item.id === "springs")
      ?.values.find((item) => item.key === "spring-front")?.value;
    const improvedSpring = improved.sections
      .find((item) => item.id === "springs")
      ?.values.find((item) => item.key === "spring-front")?.value;
    expect(Number(improvedSpring)).toBeCloseTo(Number(baselineSpring) / 9, 1);
    expect(
      improved.sections.find((item) => item.id === "damping")?.summary,
    ).toContain("B 5.46/5.46");
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
