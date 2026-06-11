import { DEFAULT_INPUT } from "../domain/defaults";
import { findBuildProfile } from "./profiles";
import type { BuildCarProfile } from "./types";

const profile: BuildCarProfile = {
  year: "1992",
  make: "Mazda",
  model: "RX-7 Type R",
  carType: "Retro Sports Cars",
  stockClass: "B",
  stockPi: 548,
  stockDrive: "RWD",
  preset: "touge_jdm_a",
  roles: [],
  order: [],
  required: [],
  optional: [],
  avoid: [],
  note: "",
  risks: [],
};

describe("build profiles", () => {
  it("matches punctuation and Type-R spelling variants", () => {
    expect(
      findBuildProfile([profile], {
        ...DEFAULT_INPUT,
        model: "RX 7 Type-R",
      }),
    ).toBe(profile);
  });

  it("does not match another model year", () => {
    expect(
      findBuildProfile([profile], {
        ...DEFAULT_INPUT,
        year: "1990",
      }),
    ).toBeUndefined();
  });

  it("matches source aliases and special-edition suffixes conservatively", () => {
    const aliased = {
      ...profile,
      year: "2018",
      make: "Funco Motorsports",
      model: "F9",
    };
    expect(
      findBuildProfile([aliased], {
        year: "2018",
        make: "Funco",
        model: "Motorsports F9 Forza Edition",
      }),
    ).toBe(aliased);
  });

  it("matches an otherwise identical model one source-year apart", () => {
    const adjacent = { ...profile, year: "1984", model: "Sport quattro" };
    expect(
      findBuildProfile([adjacent], {
        year: "1983",
        make: "Mazda",
        model: "Sport quattro",
      }),
    ).toBe(adjacent);
  });

});
