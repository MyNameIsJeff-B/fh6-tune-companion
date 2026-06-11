import type { AppliedBuildGuide } from "../build-guide/types";

export type DriveType = "FWD" | "RWD" | "AWD";
export type TuneMode =
  | "Race"
  | "Touge"
  | "Wangan"
  | "Drift"
  | "Drag"
  | "Rally"
  | "General"
  | "Rain";
export type Surface = "Road" | "Dirt" | "Snow" | "Mixed";
export type Season = "Spring" | "Summer" | "Autumn" | "Winter";
export type UnitSystem = "metric" | "imperial";
export type InputMode = "quick" | "advanced";

export type Capability =
  | "tires"
  | "gearing"
  | "alignment"
  | "arb"
  | "springs"
  | "damping"
  | "aero"
  | "brakes"
  | "differential";

export interface CarRecord {
  make: string;
  model: string;
  year: string;
  drive: DriveType;
  cls: string;
  pi: number;
  weight: number;
  weightUnit?: "lbs" | "kg";
  frontWeight?: number;
  ev?: boolean;
}

export interface BuildCapabilities {
  tires: boolean;
  gearing: "none" | "final" | "full";
  alignment: boolean;
  arb: boolean;
  springs: boolean;
  damping: boolean;
  aero: boolean;
  brakes: boolean;
  differential: boolean;
}

export interface SpringSliderRange {
  frontMin?: number;
  frontMax?: number;
  rearMin?: number;
  rearMax?: number;
  unit: "kgf/mm" | "lb/in";
}

export interface TuneInput {
  id: string;
  inputMode: InputMode;
  unitSystem: UnitSystem;
  make: string;
  model: string;
  year: string;
  driveType: DriveType;
  tuneMode: TuneMode;
  season: Season;
  surface: Surface;
  carClass: string;
  pi: number;
  weight: number;
  frontWeightPercent: number;
  tireCompound: string;
  tireFront: string;
  tireRear: string;
  redlineRpm: number;
  peakTorqueRpm?: number;
  maxTorque: number;
  topSpeed: number;
  gears: number;
  includeGearing: boolean;
  hasAero: boolean;
  aeroFront: number;
  aeroRear: number;
  dragCoefficient: number;
  feelStability: number;
  feelResponse: number;
  capabilities: BuildCapabilities;
  springSliderRange?: SpringSliderRange;
  buildGuide?: AppliedBuildGuide;
}

export interface TuneValue {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  confidence: number;
  source: "tunelab" | "improved" | "user";
}

export interface TuneSection {
  id: Capability;
  label: string;
  summary: string;
  tip: string;
  values: TuneValue[];
  available: boolean;
  unavailableReason?: string;
}

export interface TuneResult {
  id: string;
  createdAt: string;
  engineVersion: string;
  baselineVersion: string;
  catalogVersion: string;
  input: TuneInput;
  sections: TuneSection[];
  confidence: number;
  warnings: string[];
  corrections: string[];
  parentRevisionId?: string;
  revisionReason?: string;
}

export type DiagnosisId =
  | "entry-understeer"
  | "mid-understeer"
  | "exit-understeer"
  | "entry-oversteer"
  | "power-oversteer"
  | "twitchy"
  | "bouncy"
  | "wheelspin";
