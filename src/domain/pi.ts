export const FH6_MAX_PI = 998;

export const CLASS_CAPS: Record<string, number> = {
  D: 400,
  C: 500,
  B: 600,
  A: 700,
  S1: 800,
  S2: 900,
  R: FH6_MAX_PI,
  // Legacy imports used X for the top class.
  X: FH6_MAX_PI,
};

export const BUILD_CLASS_OPTIONS = ["D", "C", "B", "A", "S1", "S2", "R"];

export function classForPi(pi: number): string {
  if (pi <= CLASS_CAPS.D) return "D";
  if (pi <= CLASS_CAPS.C) return "C";
  if (pi <= CLASS_CAPS.B) return "B";
  if (pi <= CLASS_CAPS.A) return "A";
  if (pi <= CLASS_CAPS.S1) return "S1";
  if (pi <= CLASS_CAPS.S2) return "S2";
  return "R";
}

export function targetPiForClass(targetClass: string, requestedPi?: number): number {
  const cap = CLASS_CAPS[targetClass] ?? CLASS_CAPS.A;
  if (requestedPi === undefined || !Number.isFinite(requestedPi)) return cap;
  return Math.min(Math.max(100, requestedPi), cap);
}
