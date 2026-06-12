import { DEFAULT_INPUT } from "../domain/defaults";
import { calculateImproved } from "../engine/improved";
import {
  loadSpringSliderRange,
  saveSpringSliderRange,
} from "./carOverrides";
import {
  importTunes,
  garageAsJson,
  loadSavedTunes,
  tuneAsText,
  tuneHistoryFor,
} from "./tunes";

describe("local storage compatibility", () => {
  beforeEach(() => localStorage.clear());

  it("stores spring slider ranges per car", () => {
    const range = {
      frontMin: 90,
      frontMax: 290,
      rearMin: 80,
      rearMax: 260,
      unit: "kgf/mm" as const,
    };
    saveSpringSliderRange("1992", "Mazda", "RX-7 Type R", range);
    expect(loadSpringSliderRange("1992", " mazda ", "RX-7   Type R")).toEqual(
      range,
    );
    expect(loadSpringSliderRange("1993", "Mazda", "RX-7 Type R")).toBeUndefined();
  });

  it("keeps legacy tune JSON without spring ranges or peak torque compatible", () => {
    const legacy = calculateImproved({
      ...DEFAULT_INPUT,
      inputMode: "advanced",
    });
    const legacyInput = { ...legacy.input } as Record<string, unknown>;
    delete legacyInput.springSliderRange;
    delete legacyInput.season;
    legacyInput.peakTorqueRpm = 5500;
    const legacyTune = {
      ...legacy,
      engineVersion: "fh6-companion-0.2.0",
      input: legacyInput,
    };

    expect(() => importTunes(JSON.stringify(legacyTune))).not.toThrow();
    expect(loadSavedTunes()).toHaveLength(1);
    expect(loadSavedTunes()[0].input.season).toBe("Summer");
    expect(loadSavedTunes()[0].testRun).toBeUndefined();
  });

  it("filters and orders tune history by car and discipline", () => {
    const base = calculateImproved(DEFAULT_INPUT);
    const older = {
      ...base,
      id: "older",
      createdAt: "2026-06-10T10:00:00.000Z",
    };
    const current = {
      ...base,
      id: "current",
      parentRevisionId: "older",
      createdAt: "2026-06-11T10:00:00.000Z",
    };
    const otherMode = {
      ...base,
      id: "other-mode",
      createdAt: "2026-06-12T10:00:00.000Z",
      input: { ...base.input, tuneMode: "Drift" as const },
    };
    const history = tuneHistoryFor([older, otherMode], current);
    expect(history.map((item) => item.id)).toEqual(["current", "older"]);
  });

  it("includes recorded test context in shared tune text", () => {
    const result = {
      ...calculateImproved(DEFAULT_INPUT),
      testRun: {
        location: "Horizon Mexico Circuit",
        cleanLaps: 3,
        inputDevice: "Wheel" as const,
        assists: "Off" as const,
        notes: "Middenbocht stabieler.",
        observedAt: "2026-06-12T10:00:00.000Z",
      },
    };
    const text = tuneAsText(result);
    expect(text).toContain("TESTRIT");
    expect(text).toContain("Horizon Mexico Circuit · 3 schone ronden · Wheel");
    expect(text).toContain("Middenbocht stabieler.");
  });

  it("round-trips a complete garage export through the existing importer", () => {
    const first = {
      ...calculateImproved(DEFAULT_INPUT),
      id: "garage-1",
    };
    const second = {
      ...calculateImproved({
        ...DEFAULT_INPUT,
        id: "second-input",
        tuneMode: "Touge",
      }),
      id: "garage-2",
    };

    importTunes(garageAsJson([first, second]));

    expect(loadSavedTunes().map((item) => item.id)).toEqual([
      "garage-1",
      "garage-2",
    ]);
  });
});
