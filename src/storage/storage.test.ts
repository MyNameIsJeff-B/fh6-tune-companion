import { DEFAULT_INPUT } from "../domain/defaults";
import { calculateImproved } from "../engine/improved";
import {
  loadSpringSliderRange,
  saveSpringSliderRange,
} from "./carOverrides";
import { importTunes, loadSavedTunes } from "./tunes";

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
  });
});
