import type { BuildCapabilities, TuneInput, TuneMode } from "./types";

export const ENGINE_VERSION = "fh6-companion-0.3.0";
export const BASELINE_VERSION = "tunelab-1.7.0";
export const CATALOG_VERSION = "tunelab-v7+fh6-local-2026-06-10";

export const TUNE_MODES: Array<{
  id: TuneMode;
  label: string;
  sub: string;
}> = [
  { id: "Race", label: "Race", sub: "Circuit & road" },
  { id: "Touge", label: "Touge", sub: "Tight corners" },
  { id: "Wangan", label: "Wangan", sub: "High speed" },
  { id: "Drift", label: "Drift", sub: "Sideways" },
  { id: "Drag", label: "Drag", sub: "Launch focus" },
  { id: "Rally", label: "Rally", sub: "Gravel & dirt" },
  { id: "General", label: "All-round", sub: "Balanced" },
  { id: "Rain", label: "Rain", sub: "Wet control" },
];

export const ALL_CAPABILITIES: BuildCapabilities = {
  tires: true,
  gearing: "full",
  alignment: true,
  arb: true,
  springs: true,
  damping: true,
  aero: false,
  brakes: true,
  differential: true,
};

export const DEFAULT_INPUT: TuneInput = {
  id: crypto.randomUUID(),
  inputMode: "quick",
  unitSystem: "metric",
  make: "Mazda",
  model: "RX-7 Type R",
  year: "1992",
  driveType: "RWD",
  tuneMode: "Race",
  surface: "Road",
  carClass: "A",
  pi: 800,
  weight: 1260,
  frontWeightPercent: 51,
  tireCompound: "Race Semi-Slick",
  tireFront: "235/40R17",
  tireRear: "255/40R17",
  redlineRpm: 8000,
  maxTorque: 390,
  topSpeed: 260,
  gears: 6,
  includeGearing: true,
  hasAero: false,
  aeroFront: 0,
  aeroRear: 0,
  dragCoefficient: 0.32,
  feelStability: 55,
  feelResponse: 48,
  capabilities: { ...ALL_CAPABILITIES },
};
