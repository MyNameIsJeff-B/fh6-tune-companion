import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const publicData = path.resolve(scriptDir, "../public/data");
const cars = JSON.parse(await readFile(path.join(publicData, "cars.json"), "utf8")).cars;
const profilesFile = JSON.parse(
  await readFile(path.join(publicData, "build-profiles.json"), "utf8"),
);

const normalise = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(coupe|coup\u00e9)\b/g, "coupe")
    .replace(/\btype[- ]?r\b/g, "type r")
    .replace(/[^a-z0-9]+/g, "");

const normaliseMake = (value) =>
  normalise(value)
    .replace(/motorsports?$/, "")
    .replace(/automotive$/, "")
    .replace(/cars$/, "");

const normaliseModel = (value, make) =>
  normalise(value)
    .replace(new RegExp(`^${normaliseMake(make)}`), "")
    .replace(/welcomepack$/, "")
    .replace(/forzaedition$/, "")
    .replace(/tougeedition$/, "")
    .replace(/^motorsports/, "");

const findProfile = (car) => {
  const year = normalise(car.year);
  const make = normaliseMake(car.make);
  const model = normaliseModel(car.model, car.make);
  const exact = profilesFile.profiles.find(
    (profile) =>
      normalise(profile.year) === year &&
      normaliseMake(profile.make) === make &&
      normaliseModel(profile.model, profile.make) === model,
  );
  if (exact) return exact;

  const contained = profilesFile.profiles.filter((profile) => {
    if (normalise(profile.year) !== year || normaliseMake(profile.make) !== make) {
      return false;
    }
    const candidate = normaliseModel(profile.model, profile.make);
    return (
      candidate.length >= 6 &&
      model.length >= 6 &&
      (candidate.includes(model) || model.includes(candidate))
    );
  });
  if (contained.length === 1) return contained[0];

  const adjacent = profilesFile.profiles.filter(
    (profile) =>
      Math.abs(Number(profile.year) - Number(car.year)) <= 1 &&
      normaliseMake(profile.make) === make &&
      normaliseModel(profile.model, profile.make) === model,
  );
  return adjacent.length === 1 ? adjacent[0] : undefined;
};

const unmatched = cars.filter((car) => !findProfile(car));
const matched = cars.length - unmatched.length;

console.log(
  `Build profile coverage: ${matched}/${cars.length} catalog rows; ${profilesFile.profiles.length} profiles.`,
);

if (profilesFile.profiles.length !== 618 || matched < 580) {
  console.error(`Coverage below threshold. Unmatched rows: ${unmatched.length}`);
  process.exit(1);
}
