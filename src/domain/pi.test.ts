import {
  CLASS_CAPS,
  FH6_MAX_PI,
  classForPi,
  targetPiForClass,
} from "./pi";

describe("FH6 PI classes", () => {
  it("uses the post-rebalance class caps", () => {
    expect(CLASS_CAPS).toMatchObject({
      D: 400,
      C: 500,
      B: 600,
      A: 700,
      S1: 800,
      S2: 900,
      R: 998,
    });
    expect(FH6_MAX_PI).toBe(998);
  });

  it.each([
    [400, "D"],
    [401, "C"],
    [500, "C"],
    [501, "B"],
    [600, "B"],
    [601, "A"],
    [700, "A"],
    [701, "S1"],
    [800, "S1"],
    [801, "S2"],
    [900, "S2"],
    [901, "R"],
    [998, "R"],
  ])("maps PI %i to %s", (pi, expectedClass) => {
    expect(classForPi(pi)).toBe(expectedClass);
  });

  it("clamps legacy and manually invalid targets to the selected class", () => {
    expect(targetPiForClass("A", 800)).toBe(700);
    expect(targetPiForClass("S2", 998)).toBe(900);
    expect(targetPiForClass("R", 999)).toBe(998);
    expect(targetPiForClass("B")).toBe(600);
  });
});
