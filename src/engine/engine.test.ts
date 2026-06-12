import { DEFAULT_INPUT } from "../domain/defaults";
import type { DriveType, TuneMode } from "../domain/types";
import { calculateBaseline } from "./baseline";
import { applyDiagnosis } from "./diagnosis";
import { calculateImproved } from "./improved";
import { tuneAsText } from "../storage/tunes";
import {
  applyBuildPlan,
  configForPRStunt,
  defaultBuildConfig,
  defaultSelectedUpgrades,
  generateBuildPlan,
} from "../build-guide/engine";

describe("tuning engine", () => {
  it("does not numerically scale tune formulas with PI inside one class", () => {
    const lowPi = calculateImproved({
      ...DEFAULT_INPUT,
      carClass: "B",
      pi: 501,
    });
    const highPi = calculateImproved({
      ...DEFAULT_INPUT,
      carClass: "B",
      pi: 600,
    });
    expect(
      lowPi.sections.map((section) => ({
        id: section.id,
        values: section.values.map((item) => [item.key, item.value]),
      })),
    ).toEqual(
      highPi.sections.map((section) => ({
        id: section.id,
        values: section.values.map((item) => [item.key, item.value]),
      })),
    );
  });
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

  it("adjusts road tire pressure conservatively for summer and winter", () => {
    const summer = calculateBaseline({ ...DEFAULT_INPUT, season: "Summer" });
    const winter = calculateBaseline({ ...DEFAULT_INPUT, season: "Winter" });
    const pressure = (result: ReturnType<typeof calculateBaseline>) =>
      Number(
        result.sections
          .find((section) => section.id === "tires")
          ?.values.find((value) => value.key === "pressure-front")?.value,
      );
    expect(pressure(summer) - pressure(winter)).toBeCloseTo(0.15, 2);
    expect(pressure(summer)).toBeCloseTo(2, 2);
    expect(pressure(winter)).toBeCloseTo(1.85, 2);
    expect(
      calculateImproved({ ...DEFAULT_INPUT, season: "Winter" }).warnings.some(
        (warning) => warning.includes("langere braking distances"),
      ),
    ).toBe(true);
  });

  it("keeps road bump at or below 55% of rebound", () => {
    const roadModes = ["Race", "Touge", "Wangan", "General", "Rain"] satisfies TuneMode[];
    roadModes.forEach((tuneMode) => {
      const result = calculateImproved({
        ...DEFAULT_INPUT,
        tuneMode,
        surface: "Road",
      });
      const damping = result.sections.find((section) => section.id === "damping");
      const rebound = Number(
        damping?.values.find((value) => value.key === "rebound-front")?.value,
      );
      const bump = Number(
        damping?.values.find((value) => value.key === "bump-front")?.value,
      );
      expect(bump / rebound).toBeLessThanOrEqual(0.55);
    });
  });

  it("keeps Horizon road toe neutral and does not change it for stability feel", () => {
    const result = calculateImproved({
      ...DEFAULT_INPUT,
      feelStability: 90,
      surface: "Road",
    });
    const alignment = result.sections.find((section) => section.id === "alignment");
    expect(
      alignment?.values.find((value) => value.key === "toe-front")?.value,
    ).toBe(0);
    expect(
      alignment?.values.find((value) => value.key === "toe-rear")?.value,
    ).toBe(0);
    expect(
      result.warnings.some((warning) => warning.includes("rear toe-in richting")),
    ).toBe(true);
  });

  it("uses a 3% limiter margin for advanced Final Drive", () => {
    const input = {
      ...DEFAULT_INPUT,
      inputMode: "advanced" as const,
      includeGearing: true,
      redlineRpm: 7800,
      topSpeed: 265,
      tireRear: "255/40R17",
    };
    const result = calculateImproved(input);
    const gearing = result.sections.find((section) => section.id === "gearing");
    const finalDrive = Number(
      gearing?.values.find((value) => value.key === "final-drive")?.value,
    );
    const topGear = Number(
      gearing?.values.find((value) => value.key === `gear-${input.gears}`)?.value,
    );
    const radiusM = (17 * 25.4 * 0.5 + 255 * 0.4) / 1000;
    const circumference = 2 * Math.PI * radiusM;
    const reachedRpm =
      (input.topSpeed * 60 * finalDrive * topGear) /
      (circumference * 3.6);
    expect(reachedRpm).toBeLessThan(input.redlineRpm);
    expect(reachedRpm / input.redlineRpm).toBeCloseTo(0.97, 2);
    expect(
      result.corrections.some((correction) => correction.includes("3% RPM-marge")),
    ).toBe(true);
  });

  it("keeps Brake Balance direction explicit in values and share text", () => {
    const rearHeavy = calculateImproved({
      ...DEFAULT_INPUT,
      frontWeightPercent: 45,
    });
    const frontHeavy = calculateImproved({
      ...DEFAULT_INPUT,
      frontWeightPercent: 60,
    });
    const balance = (result: ReturnType<typeof calculateImproved>) =>
      result.sections
        .find((section) => section.id === "brakes")
        ?.values.find((value) => value.key === "brake-balance");
    expect(Number(balance(frontHeavy)?.value)).toBeGreaterThan(
      Number(balance(rearHeavy)?.value),
    );
    expect(balance(frontHeavy)?.unit).toBe("% voor");
    expect(tuneAsText(frontHeavy)).toContain(
      "Brake Balance: hogere % = meer front bias; 50% = gelijk.",
    );
  });

  it("keeps known user-facing explanations in Dutch", () => {
    const result = calculateImproved({
      ...DEFAULT_INPUT,
      season: "Winter",
      tireCompound: "Snow",
    });
    const text = [...result.corrections, ...result.warnings].join(" ");
    expect(text).not.toContain("Summer baseline uses");
    expect(text).not.toContain("Winter baseline uses");
    expect(text).not.toContain("Snow Tires are only appropriate");
    expect(text).not.toContain("This seasonal build prioritises");
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
    expect(advanced.engineVersion).toBe("fh6-companion-0.7.0");
  });

  it("keeps Rally pressure separate from the low-pressure Off-Road band", () => {
    const rally = calculateImproved({
      ...DEFAULT_INPUT,
      tuneMode: "Rally",
      surface: "Dirt",
      tireCompound: "Rally",
    });
    const offroad = calculateImproved({
      ...DEFAULT_INPUT,
      tuneMode: "Rally",
      surface: "Dirt",
      tireCompound: "Off-Road",
    });
    const pressure = (result: ReturnType<typeof calculateImproved>) =>
      Number(
        result.sections
          .find((section) => section.id === "tires")
          ?.values.find((value) => value.key === "pressure-front")?.value,
      );
    expect(pressure(rally)).toBeGreaterThan(pressure(offroad));
    expect(pressure(offroad)).toBe(1.25);
    expect(
      rally.corrections.some((correction) =>
        correction.includes("Street-pressure band"),
      ),
    ).toBe(true);
  });

  it("uses compound-aware road camber", () => {
    const sport = calculateImproved({
      ...DEFAULT_INPUT,
      tireCompound: "Sport",
    });
    const slick = calculateImproved({
      ...DEFAULT_INPUT,
      tireCompound: "Race Slick",
    });
    const frontCamber = (result: ReturnType<typeof calculateImproved>) =>
      Number(
        result.sections
          .find((section) => section.id === "alignment")
          ?.values.find((value) => value.key === "camber-front")?.value,
      );
    expect(frontCamber(sport)).toBe(-1.2);
    expect(frontCamber(slick)).toBe(-1.8);
  });

  it("filters Sport Differential output to acceleration sliders", () => {
    const result = calculateImproved({
      ...DEFAULT_INPUT,
      driveType: "AWD",
      capabilities: {
        ...DEFAULT_INPUT.capabilities,
        differential: "accel",
      },
    });
    const keys = result.sections
      .find((section) => section.id === "differential")
      ?.values.map((value) => value.key);
    expect(keys).toEqual(["diff-front-accel", "diff-rear-accel"]);
  });

  it("keeps legacy boolean differential capabilities compatible", () => {
    const available = calculateImproved({
      ...DEFAULT_INPUT,
      capabilities: {
        ...DEFAULT_INPUT.capabilities,
        differential: true,
      },
    });
    const unavailable = calculateImproved({
      ...DEFAULT_INPUT,
      capabilities: {
        ...DEFAULT_INPUT.capabilities,
        differential: false,
      },
    });
    expect(
      available.sections.find((section) => section.id === "differential")
        ?.available,
    ).toBe(true);
    expect(
      unavailable.sections.find((section) => section.id === "differential")
        ?.available,
    ).toBe(false);
  });

  it("suppresses combustion gearing math for an EV with one gear", () => {
    const result = calculateImproved({
      ...DEFAULT_INPUT,
      ev: true,
      inputMode: "advanced",
      gears: 1,
      includeGearing: true,
    });
    expect(
      result.sections.find((section) => section.id === "gearing")?.values,
    ).toHaveLength(0);
    expect(
      result.warnings.some((warning) => warning.includes("EV/1-speed gearing")),
    ).toBe(true);
  });

  it("adds Aero Balance and discipline-specific guidance", () => {
    const wangan = calculateImproved({
      ...DEFAULT_INPUT,
      tuneMode: "Wangan",
      hasAero: true,
      capabilities: {
        ...DEFAULT_INPUT.capabilities,
        aero: true,
      },
    });
    expect(
      wangan.sections.find((section) => section.id === "aero")?.tip,
    ).toContain("0,40-0,45");
    expect(
      wangan.warnings.some((warning) => warning.includes("Wangan gebruikt")),
    ).toBe(true);

    const touge = calculateImproved({
      ...DEFAULT_INPUT,
      tuneMode: "Touge",
      driveType: "RWD",
    });
    const diff = touge.sections.find((section) => section.id === "differential");
    expect(
      diff?.values.find((value) => value.key === "diff-rear-accel")?.value,
    ).toBe(60);
    expect(
      diff?.values.find((value) => value.key === "diff-rear-decel")?.value,
    ).toBe(30);
  });

  const stuntInput = (
    type:
      | "speed_trap"
      | "speed_zone"
      | "danger_sign"
      | "drift_zone"
      | "trailblazer",
    driveType: DriveType = "AWD",
  ) => {
    const base = {
      ...DEFAULT_INPUT,
      inputMode: "advanced" as const,
      driveType,
      hasAero: true,
      includeGearing: true,
      capabilities: {
        ...DEFAULT_INPUT.capabilities,
        aero: true,
        gearing: "full" as const,
      },
    };
    const config = configForPRStunt(defaultBuildConfig(base), type);
    const plan = generateBuildPlan(base, config);
    return applyBuildPlan(base, plan, defaultSelectedUpgrades(plan));
  };

  it("uses the Speed variant for Speed Traps", () => {
    const input = {
      ...stuntInput("speed_trap"),
      hasAero: true,
      capabilities: {
        ...stuntInput("speed_trap").capabilities,
        aero: true,
      },
    };
    const result = calculateImproved(input);
    const aero = result.sections.find((section) => section.id === "aero");
    expect(aero?.values.find((value) => value.key === "aero-front")?.value).toBe(
      "Minimum slider",
    );
    expect(
      result.corrections.some((item) => item.includes("Speed Trap-variant")),
    ).toBe(true);
    expect(result.techniqueTips?.[0]).toContain("1-2 km");
  });

  it("keeps Speed Zones in Race with longer gearing and aero guidance", () => {
    const input = stuntInput("speed_zone");
    const standard = calculateImproved({
      ...input,
      buildGuide: undefined,
      tuneMode: "Race",
    });
    const result = calculateImproved(input);
    const finalDrive = (value: ReturnType<typeof calculateImproved>) =>
      Number(
        value.sections
          .find((section) => section.id === "gearing")
          ?.values.find((item) => item.key === "final-drive")?.value,
      );
    expect(finalDrive(result)).toBeLessThan(finalDrive(standard));
    expect(result.sections.find((section) => section.id === "aero")?.tip).toContain(
      "0,40-0,45",
    );
  });

  it("uses the Jump variant for Danger Signs", () => {
    const input = stuntInput("danger_sign", "RWD");
    const standard = calculateImproved({
      ...input,
      buildGuide: undefined,
      tuneMode: "General",
    });
    const result = calculateImproved(input);
    const value = (
      output: ReturnType<typeof calculateImproved>,
      sectionId: "damping" | "springs",
      key: string,
    ) =>
      Number(
        output.sections
          .find((section) => section.id === sectionId)
          ?.values.find((item) => item.key === key)?.value,
      );
    expect(value(result, "damping", "bump-front")).toBeLessThan(
      value(standard, "damping", "bump-front"),
    );
    expect(value(result, "damping", "rebound-front")).toBeLessThan(
      value(standard, "damping", "rebound-front"),
    );
    expect(value(result, "springs", "ride-front")).toBeGreaterThan(
      value(standard, "springs", "ride-front"),
    );
  });

  it("adds the hard Drift Zone scoring guidance", () => {
    const result = calculateImproved(stuntInput("drift_zone", "AWD"));
    expect(
      result.warnings.some((item) => item.includes("scoort alleen met RWD")),
    ).toBe(true);
    expect(result.techniqueTips?.join(" ")).toContain("Stability Control");
  });

  it("uses Cross Country deltas for Trailblazers", () => {
    const input = stuntInput("trailblazer");
    const result = calculateImproved(input);
    const differential = result.sections.find(
      (section) => section.id === "differential",
    );
    expect(
      differential?.values.find((value) => value.key === "diff-center")?.value,
    ).toBe(65);
    expect(result.sections.find((section) => section.id === "springs")?.tip).toContain(
      "5-7 in",
    );
    expect(
      result.corrections.some((item) => item.includes("kortere gearing")),
    ).toBe(true);
  });

  it("creates an immutable diagnosis revision", () => {
    const original = calculateImproved(DEFAULT_INPUT);
    const revised = applyDiagnosis(original, "power-oversteer", {
      location: "  Horizon Mexico Circuit  ",
      cleanLaps: 2.6,
      inputDevice: "Controller",
      assists: "ABS",
      notes: "  Uitkomen bocht 7 blijft onrustig.  ",
    });
    expect(revised.parentRevisionId).toBe(original.id);
    expect(revised.id).not.toBe(original.id);
    expect(original.revisionReason).toBeUndefined();
    expect(original.testRun).toBeUndefined();
    expect(revised.revisionReason).toBe("Power-overstuur");
    expect(revised.testRun).toMatchObject({
      location: "Horizon Mexico Circuit",
      cleanLaps: 3,
      inputDevice: "Controller",
      assists: "ABS",
      notes: "Uitkomen bocht 7 blijft onrustig.",
    });
    expect(revised.testRun?.observedAt).toBeTruthy();
    const differential = revised.sections.find(
      (item) => item.id === "differential",
    );
    const rearAccel = differential?.values.find(
      (item) => item.key === "diff-rear-accel",
    )?.value;
    expect(differential?.summary).toBe(`${rearAccel}% accel`);
    const damping = revised.sections.find((item) => item.id === "damping");
    const bumpFront = damping?.values.find(
      (item) => item.key === "bump-front",
    )?.value;
    const bumpRear = damping?.values.find(
      (item) => item.key === "bump-rear",
    )?.value;
    expect(damping?.summary).toContain(`B ${bumpFront}/${bumpRear}`);
  });

  it("lowers confidence when core data is missing", () => {
    const result = calculateImproved({ ...DEFAULT_INPUT, weight: 0 });
    expect(result.warnings.some((warning) => warning.includes("Gewicht"))).toBe(true);
    expect(
      result.warnings.some((warning) => warning.includes("demping")),
    ).toBe(false);
    expect(
      result.sections
        .find((section) => section.id === "differential")
        ?.values.every((value) => value.confidence === 0.25),
    ).toBe(true);
    expect(result.confidence).toBeLessThan(0.8);
  });

  it("adds the low-pressure meta note without changing road pressure values", () => {
    const baseline = calculateBaseline(DEFAULT_INPUT);
    const improved = calculateImproved(DEFAULT_INPUT);
    const pressures = (result: ReturnType<typeof calculateBaseline>) =>
      result.sections
        .find((section) => section.id === "tires")
        ?.values.filter((value) => value.key.startsWith("pressure-"))
        .map((value) => value.value);
    expect(pressures(improved)).toEqual(pressures(baseline));
    expect(
      improved.warnings.some((warning) => warning.includes("circa 1,1 bar")),
    ).toBe(true);
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
