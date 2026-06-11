import { DEFAULT_INPUT } from "../domain/defaults";
import type { DriveType, TuneMode } from "../domain/types";
import {
  BUILD_CLASS_OPTIONS,
  CLASS_CAPS,
  applyBuildPlan,
  defaultBuildConfig,
  defaultSelectedUpgrades,
  generateBuildPlan,
} from "./engine";
import { BUILD_SOURCES } from "./sources";
import type { BuildCarProfile } from "./types";

const RX7_PROFILE: BuildCarProfile = {
  year: "1992",
  make: "Mazda",
  model: "RX-7 Type R",
  carType: "Retro Sports Cars",
  stockClass: "B",
  stockPi: 548,
  stockDrive: "RWD",
  preset: "touge_jdm_a",
  roles: ["touge_or_drift_project"],
  order: ["tires", "brakes", "weight", "suspension/ARB", "diff"],
  required: ["race_springs", "ARB", "race_diff", "final_drive"],
  optional: ["street/semi-slick", "race brakes"],
  avoid: ["huge turbo lag", "top-speed gearing"],
  note: "Braking and exit control beat peak power",
  risks: ["needs_in_game_weight_for_exact_springs"],
};

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
    expect(plan.warnings.some((warning) => warning.includes("PI cost"))).toBe(true);
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
    const compounds = BUILD_CLASS_OPTIONS.map((targetClass) => {
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

  it("keeps Rain builds wet-capable in high classes", () => {
    const config = {
      ...defaultBuildConfig(DEFAULT_INPUT),
      tuneMode: "Rain" as const,
      targetClass: "R",
      targetPi: 999,
    };
    const tire = generateBuildPlan(DEFAULT_INPUT, config).stages
      .find((stage) => stage.id === "tires")
      ?.upgrades.find((upgrade) => upgrade.tireCompound);
    expect(tire?.tireCompound).toBe("Race Semi-Slick");
  });

  it("keeps winter and snow-event intent separate", () => {
    const winterRoad = generateBuildPlan(DEFAULT_INPUT, {
      ...defaultBuildConfig(DEFAULT_INPUT),
      season: "Winter",
      surface: "Road",
    });
    const winterSnow = generateBuildPlan(DEFAULT_INPUT, {
      ...defaultBuildConfig(DEFAULT_INPUT),
      season: "Winter",
      surface: "Snow",
    });
    expect(
      winterRoad.stages
        .find((stage) => stage.id === "tires")
        ?.upgrades.find((upgrade) => upgrade.tireCompound)?.tireCompound,
    ).not.toBe("Snow");
    expect(
      winterSnow.stages
        .find((stage) => stage.id === "tires")
        ?.upgrades.find((upgrade) => upgrade.tireCompound)?.tireCompound,
    ).toBe("Snow");
  });

  it("uses R as the current top class and migrates legacy X builds", () => {
    const input = {
      ...DEFAULT_INPUT,
      carClass: "R",
      pi: 999,
      buildGuide: {
        version: "build-guide-0.3.0",
        focus: "balanced" as const,
        targetClass: "X",
        targetPi: 999,
        selectedUpgradeIds: [],
        warnings: [],
        valuesConfirmed: false,
      },
    };
    expect(defaultBuildConfig(input).targetClass).toBe("R");
    expect(defaultBuildConfig(input).targetPi).toBe(999);
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
    expect(plan.warnings.some((warning) => warning.includes("below the current"))).toBe(
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

  it("adds a matched car profile without replacing the selected discipline", () => {
    const config = {
      ...defaultBuildConfig(DEFAULT_INPUT),
      tuneMode: "Rally" as const,
      surface: "Mixed" as const,
    };
    const plan = generateBuildPlan(DEFAULT_INPUT, config, RX7_PROFILE);
    expect(plan.profile?.preset).toBe("touge_jdm_a");
    expect(plan.config.tuneMode).toBe("Rally");
    expect(plan.stages.find((stage) => stage.id === "chassis")?.upgrades[0].id).toBe(
      "rally-suspension",
    );
    expect(plan.confidence).toBeGreaterThan(0.8);
  });

  it("uses off-road suspension for a cross-country car profile", () => {
    const profile = { ...RX7_PROFILE, preset: "cross_country_a_s1" };
    const config = {
      ...defaultBuildConfig(DEFAULT_INPUT),
      tuneMode: "Rally" as const,
      surface: "Mixed" as const,
    };
    const plan = generateBuildPlan(DEFAULT_INPUT, config, profile);
    expect(plan.stages.find((stage) => stage.id === "chassis")?.upgrades[0].id).toBe(
      "offroad-suspension",
    );
    expect(
      plan.stages
        .find((stage) => stage.id === "tires")
        ?.upgrades.find((upgrade) => upgrade.tireCompound)?.tireCompound,
    ).toBe("Off-Road");
    expect(plan.stages.slice(0, 3).map((stage) => stage.id)).toEqual([
      "tires",
      "chassis",
      "foundation",
    ]);
  });

  it("turns a car profile order into the active stage order", () => {
    const plan = generateBuildPlan(
      DEFAULT_INPUT,
      defaultBuildConfig(DEFAULT_INPUT),
      RX7_PROFILE,
    );
    expect(plan.stages.slice(0, 4).map((stage) => stage.id)).toEqual([
      "tires",
      "chassis",
      "weight",
      "foundation",
    ]);
  });
});
