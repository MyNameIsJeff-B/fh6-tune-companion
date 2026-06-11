import type { TuneInput } from "../domain/types";
import type { BuildCarProfile, RawBuildProfilesFile } from "./types";

let cache: BuildCarProfile[] | null = null;

const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(coupe|coup\u00e9)\b/g, "coupe")
    .replace(/\btype[- ]?r\b/g, "type r")
    .replace(/[^a-z0-9]+/g, "");

const normaliseMake = (value: string) =>
  normalise(value)
    .replace(/motorsports?$/, "")
    .replace(/automotive$/, "")
    .replace(/cars$/, "");

const normaliseModel = (value: string, make: string) => {
  const canonicalMake = normaliseMake(make);
  return normalise(value)
    .replace(new RegExp(`^${canonicalMake}`), "")
    .replace(/welcomepack$/, "")
    .replace(/forzaedition$/, "")
    .replace(/tougeedition$/, "")
    .replace(/^motorsports/, "");
};

export async function loadBuildProfiles(): Promise<BuildCarProfile[]> {
  if (cache) return cache;
  const response = await fetch(
    `${import.meta.env.BASE_URL}data/build-profiles.json`,
  );
  if (!response.ok) {
    throw new Error("Build profiles could not be loaded.");
  }
  const raw = (await response.json()) as RawBuildProfilesFile;
  cache = raw.profiles;
  return cache;
}

export function findBuildProfile(
  profiles: BuildCarProfile[],
  input: Pick<TuneInput, "year" | "make" | "model">,
): BuildCarProfile | undefined {
  const year = normalise(input.year);
  const make = normaliseMake(input.make);
  const model = normaliseModel(input.model, input.make);

  const exact = profiles.find(
    (profile) =>
      normalise(profile.year) === year &&
      normaliseMake(profile.make) === make &&
      normaliseModel(profile.model, profile.make) === model,
  );
  if (exact) return exact;

  const sameYearAndMake = profiles.filter(
    (profile) =>
      normalise(profile.year) === year && normaliseMake(profile.make) === make,
  );
  const contained = sameYearAndMake.filter((profile) => {
    const candidate = normaliseModel(profile.model, profile.make);
    return (
      candidate.length >= 6 &&
      model.length >= 6 &&
      (candidate.includes(model) || model.includes(candidate))
    );
  });
  if (contained.length === 1) return contained[0];

  const numericYear = Number(input.year);
  if (Number.isFinite(numericYear)) {
    const adjacent = profiles.filter(
      (profile) =>
        Math.abs(Number(profile.year) - numericYear) <= 1 &&
        normaliseMake(profile.make) === make &&
        normaliseModel(profile.model, profile.make) === model,
    );
    if (adjacent.length === 1) return adjacent[0];
  }

  return undefined;
}

const PROFILE_LABELS: Record<string, string> = {
  ARB: "Anti-Roll Bars",
  diff: "Differential",
  "suspension/ARB": "Suspension and Anti-Roll Bars",
  "street/semi-slick": "Street or Semi-Slick Tires",
  "final drive/transmission if bad":
    "Final Drive or Transmission if the stock gearing is unsuitable",
  "street tire only if needed": "Street Tires only when needed",
};

export const buildProfileLabel = (value: string) =>
  PROFILE_LABELS[value] ??
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
