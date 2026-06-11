import type {
  BuildCapabilities,
  DriveType,
  Season,
  Surface,
  TuneMode,
} from "../domain/types";

export type BuildFocus =
  | "balanced"
  | "grip"
  | "acceleration"
  | "speed"
  | "control";

export type BuildPriority = "recommend" | "optional" | "later" | "avoid";

export type BuildUpgradeId =
  | "differential"
  | "sport-transmission"
  | "race-transmission"
  | "arb"
  | "street-tires"
  | "sport-tires"
  | "semi-slick-tires"
  | "slick-tires"
  | "rally-tires"
  | "offroad-tires"
  | "snow-tires"
  | "drag-tires"
  | "drift-tires"
  | "front-width"
  | "rear-width"
  | "balanced-width"
  | "weight-1"
  | "weight-2"
  | "weight-3"
  | "race-suspension"
  | "rally-suspension"
  | "offroad-suspension"
  | "drift-suspension"
  | "race-brakes"
  | "chassis-reinforcement"
  | "power-light"
  | "power-heavy"
  | "front-aero"
  | "rear-aero";

export interface BuildGuideConfig {
  tuneMode: TuneMode;
  season: Season;
  surface: Surface;
  focus: BuildFocus;
  targetClass: string;
  targetPi: number;
  keepStockEngine: boolean;
  keepStockDrivetrain: boolean;
  avoidAero: boolean;
}

export interface BuildUpgrade {
  id: BuildUpgradeId;
  name: string;
  detail: string;
  priority: BuildPriority;
  confidence: number;
  sourceIds: string[];
  capabilityPatch?: Partial<BuildCapabilities>;
  tireCompound?: string;
}

export interface BuildStage {
  id: "foundation" | "tires" | "weight" | "chassis" | "power" | "aero";
  label: string;
  summary: string;
  priority: BuildPriority;
  upgrades: BuildUpgrade[];
}

export interface BuildCarProfile {
  year: string;
  make: string;
  model: string;
  carType: string;
  stockClass: string;
  stockPi: number;
  stockDrive: DriveType;
  preset: string;
  roles: string[];
  order: string[];
  required: string[];
  optional: string[];
  avoid: string[];
  note: string;
  risks: string[];
}

export interface RawBuildProfilesFile {
  version: string;
  source: string;
  generated: string;
  profiles: BuildCarProfile[];
}

export interface BuildPlan {
  version: string;
  config: BuildGuideConfig;
  driveType: DriveType;
  currentPi: number;
  piBudget: number;
  confidence: number;
  warnings: string[];
  profile?: BuildCarProfile;
  stages: BuildStage[];
}

export interface AppliedBuildGuide {
  version: string;
  focus: BuildFocus;
  targetClass: string;
  targetPi: number;
  tuneMode?: TuneMode;
  season?: Season;
  surface?: Surface;
  keepStockEngine?: boolean;
  keepStockDrivetrain?: boolean;
  avoidAero?: boolean;
  selectedUpgradeIds: BuildUpgradeId[];
  warnings: string[];
  valuesConfirmed: boolean;
}

export interface BuildSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: "official" | "calculator" | "community" | "local";
  use: string;
  limitation: string;
  verified: string;
}
