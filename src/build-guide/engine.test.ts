import { DEFAULT_INPUT } from "../domain/defaults";
import type { DriveType, TuneMode } from "../domain/types";
import {
  CLASS_CAPS,
  applyBuildPlan,
  defaultBuildConfig,
  defaultSelectedUpgrades,
  generateBuildPlan,
} from "./engine";
import { BUILD_SOURCES } from "./sources";

describe("build guide", () => {
  it.each([
    "Race",
    "Touge",
    "Wangan",
    "Drift",
    "Drag",
    "Rally",
    "General",
    "Rain",
  ] satisfies TuneMode[])("creates a complete %s plan", (tuneMode) => {
    const config = {
      ...defaultBuildConfig(DEFAULT_INPUT),
      tuneMode,
      surface: tuneMode === "Rally" ? ("Mixed" as const) : ("Road" as const),
    };
    const plan = generateBuildPlan(DEFAULT_INPUT, config);
    expect(plan.stages).toHaveLength(6);
    expect(plan.stages.every((stage) => stage.upgrades.length > 0)).toBe(true);
    expect(plan.warnings.some((warning) => warning.includes("PI-kosten"))).toBe(true);
  });

  it.each(["FWD", "RWD", "AWD"] satisfies DriveType[])(
    "prioritises tire width for %s",
    (driveType) => {
      const input = { ...DEFAULT_INPUT, driveType };
      const plan = generateBuildPlan(input, defaultBuildConfig(input));
      const tireIds = plan.stages
        .find((stage) => stage.id === "tires")
        ?.upgrades.map((upgrade) => upgrade.id);
      expect(tireIds).toContain(
        driveType === "FWD"
          ? "front-width"
          : driveType === "RWD"
            ? "rear-width"
            : "balanced-width",
      );
    },
  );

  it("uses class-sensitive road compounds", () => {
    const compounds = Object.keys(CLASS_CAPS).map((targetClass) => {
      const config = {
        ...defaultBuildConfig(DEFAULT_INPUT),
        targetClass,
        targetPi: CLASS_CAPS[targetClass],
      };
      return generateBuildPlan(DEFAULT_INPUT, config).stages
        .find((stage) => stage.id === "tires")
        ?.upgrades.find((upgrade) => upgrade.tireCompound)?.tireCompound;
    });
    expect(compounds).toEqual([
      "Street",
      "Street",
      "Sport",
      "Race Semi-Slick",
      "Race Semi-Slick",
      "Race Slick",
      "Race Slick",
    ]);
  });

  it("applies selected upgrade capabilities without exposing missing parts", () => {
    const plan = generateBuildPlan(DEFAULT_INPUT, defaultBuildConfig(DEFAULT_INPUT));
    const result = applyBuildPlan(DEFAULT_INPUT, plan, [
      "differential",
      "sport-transmission",
      "race-suspension",
    ]);
    expect(result.capabilities.differential).toBe(true);
    expect(result.capabilities.gearing).toBe("final");
    expect(result.capabilities.alignment).toBe(true);
    expect(result.capabilities.springs).toBe(true);
    expect(result.capabilities.damping).toBe(true);
    expect(result.capabilities.arb).toBe(false);
    expect(result.capabilities.aero).toBe(false);
  });

  it("defaults to recommended upgrades only", () => {
    const plan = generateBuildPlan(DEFAULT_INPUT, defaultBuildConfig(DEFAULT_INPUT));
    const selected = defaultSelectedUpgrades(plan);
    const selectedEntries = plan.stages.flatMap((stage) =>
      stage.upgrades
        .filter((upgrade) => selected.includes(upgrade.id))
        .map((upgrade) => ({ stage: stage.priority, upgrade: upgrade.priority })),
    );
    expect(
      selectedEntries.every(
        (entry) => entry.stage === "recommend" && entry.upgrade === "recommend",
      ),
    ).toBe(true);
    expect(selected).not.toContain("race-suspension");
  });

  it("keeps terrain suspension in the recommended off-road foundation", () => {
    const input = { ...DEFAULT_INPUT, tuneMode: "Rally" as const, surface: "Mixed" as const };
    const plan = generateBuildPlan(input, defaultBuildConfig(input));
    expect(plan.stages.find((stage) => stage.id === "chassis")?.priority).toBe(
      "recommend",
    );
    expect(defaultSelectedUpgrades(plan)).toContain("rally-suspension");
  });

  it("marks swaps and exact PI as uncertain", () => {
    const config = {
      ...defaultBuildConfig(DEFAULT_INPUT),
      keepStockEngine: false,
      keepStockDrivetrain: false,
    };
    const plan = generateBuildPlan(DEFAULT_INPUT, config);
    expect(plan.confidence).toBeLessThan(0.7);
    expect(plan.warnings.some((warning) => warning.includes("drivetrain swap"))).toBe(true);
  });

  it("changes recommendations with the selected focus", () => {
    const base = defaultBuildConfig(DEFAULT_INPUT);
    const acceleration = generateBuildPlan(DEFAULT_INPUT, {
      ...base,
      focus: "acceleration",
    });
    const control = generateBuildPlan(DEFAULT_INPUT, {
      ...base,
      focus: "control",
    });
    expect(
      acceleration.stages
        .find((stage) => stage.id === "foundation")
        ?.upgrades.some((upgrade) => upgrade.id === "race-transmission"),
    ).toBe(true);
    expect(control.stages.find((stage) => stage.id === "chassis")?.priority).toBe(
      "recommend",
    );
  });

  it("warns when the target PI is below the current build", () => {
    const plan = generateBuildPlan(
      { ...DEFAULT_INPUT, pi: 900 },
      { ...defaultBuildConfig(DEFAULT_INPUT), targetClass: "A", targetPi: 800 },
    );
    expect(plan.warnings.some((warning) => warning.includes("onder de huidige"))).toBe(
      true,
    );
  });

  it("only references declared research sources", () => {
    const sourceIds = new Set(BUILD_SOURCES.map((source) => source.id));
    const plan = generateBuildPlan(DEFAULT_INPUT, defaultBuildConfig(DEFAULT_INPUT));
    const referenced = plan.stages.flatMap((stage) =>
      stage.upgrades.flatMap((upgrade) => upgrade.sourceIds),
    );
    expect(referenced.every((id) => sourceIds.has(id))).toBe(true);
  });

  it("restores an applied build configuration for later editing", () => {
    const config = {
      ...defaultBuildConfig(DEFAULT_INPUT),
      focus: "speed" as const,
      keepStockEngine: false,
      avoidAero: false,
    };
    const plan = generateBuildPlan(DEFAULT_INPUT, config);
    const applied = applyBuildPlan(
      DEFAULT_INPUT,
      plan,
      defaultSelectedUpgrades(plan),
    );
    expect(defaultBuildConfig(applied)).toEqual(config);
  });
});
