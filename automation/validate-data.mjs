import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const hashFile = async (file) =>
  createHash("sha256").update(await readFile(file)).digest("hex");

const runGenerator = () =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["automation/generate-data.mjs"], {
      stdio: "inherit",
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Generator stopte met ${code}`)),
    );
  });

await runGenerator();
const first = {
  cars: await hashFile("public/data/cars.json"),
  profiles: await hashFile("public/data/build-profiles.json"),
};
await runGenerator();
const second = {
  cars: await hashFile("public/data/cars.json"),
  profiles: await hashFile("public/data/build-profiles.json"),
};
if (first.cars !== second.cars || first.profiles !== second.profiles) {
  throw new Error("Datageneratie is niet deterministisch.");
}

const catalog = JSON.parse(await readFile("public/data/cars.json", "utf8"));
const profiles = JSON.parse(
  await readFile("public/data/build-profiles.json", "utf8"),
);
if (catalog.cars.length !== 618) {
  throw new Error(`Catalogus moet exact 618 officiële auto's bevatten, niet ${catalog.cars.length}.`);
}
if (profiles.profiles.length !== 618) {
  throw new Error(`Profielset moet exact 618 auto's bevatten, niet ${profiles.profiles.length}.`);
}

const normalise = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
const carKey = (car) =>
  `${car.year}|${normalise(car.make)}|${normalise(car.model)}`;
const keys = new Set();
for (const car of catalog.cars) {
  const key = carKey(car);
  if (keys.has(key)) throw new Error(`Dubbele auto-identiteit: ${key}`);
  keys.add(key);
}

const caps = { D: 400, C: 500, B: 600, A: 700, S1: 800, S2: 900, R: 998 };
const classForPi = (pi) =>
  pi <= 400 ? "D"
    : pi <= 500 ? "C"
      : pi <= 600 ? "B"
        : pi <= 700 ? "A"
          : pi <= 800 ? "S1"
            : pi <= 900 ? "S2"
              : "R";
for (const car of catalog.cars) {
  const key = carKey(car);
  if (!caps[car.cls]) throw new Error(`Onbekende klasse voor ${key}: ${car.cls}`);
  if (!car.pi || car.pi < 100 || car.pi > 998) {
    throw new Error(`Ongeldige officiële PI voor ${key}: ${car.pi}`);
  }
  if (classForPi(car.pi) !== car.cls) {
    throw new Error(`Klasse/PI-conflict voor ${key}: ${car.cls} ${car.pi}`);
  }
  if (
    car.fieldSources?.identity !== "forza-official" ||
    car.fieldSources?.cls !== "forza-official" ||
    car.fieldSources?.pi !== "forza-official"
  ) {
    throw new Error(`Officiële veldbron ontbreekt voor ${key}.`);
  }
  const technicalFields = ["drive", "weight", "fd", "gears", "ev"];
  const hasTechnicalField = technicalFields.some(
    (field) => car.fieldSources?.[field],
  );
  if (hasTechnicalField !== (car.dataStatus === "technical")) {
    throw new Error(`Bron/status-conflict voor ${key}: ${car.dataStatus}`);
  }
  for (const field of technicalFields) {
    const source = car.fieldSources?.[field];
    if (
      source &&
      !source.startsWith("tunelab-") &&
      !source.startsWith("crosscheck-")
    ) {
      throw new Error(`Onbekende technische veldbron voor ${key}.${field}: ${source}`);
    }
  }
}

const catalogByKey = new Map(catalog.cars.map((car) => [carKey(car), car]));
for (const profile of profiles.profiles) {
  const car = catalogByKey.get(carKey(profile));
  if (!car) throw new Error(`Profiel zonder officiële auto: ${carKey(profile)}`);
  if (profile.stockClass !== car.cls || profile.stockPi !== car.pi) {
    throw new Error(
      `Profiel/cataloog-conflict voor ${carKey(profile)}: ` +
      `${profile.stockClass} ${profile.stockPi} versus ${car.cls} ${car.pi}`,
    );
  }
  if (profile.stockDrive !== car.drive) {
    throw new Error(
      `Profiel/cataloog-aandrijving verschilt voor ${carKey(profile)}: ` +
      `${profile.stockDrive} versus ${car.drive}`,
    );
  }
}

const regressionCars = [
  ["1972", "Chevrolet", "K-10 Custom", "AWD", "crosscheck-chevrolet-ck"],
  ["2018", "Renault", "Megane R.S.", "FWD", "crosscheck-renault-megane-rs"],
];
for (const [year, make, model, drive, source] of regressionCars) {
  const car = catalogByKey.get(carKey({ year, make, model }));
  if (car?.drive !== drive || car.fieldSources?.drive !== source) {
    throw new Error(`Technische bronregressie voor ${year} ${make} ${model}.`);
  }
}

const license = await readFile("automation/data/TUNELAB-LICENSE.txt", "utf8");
if (!license.includes("MIT License")) throw new Error("TuneLab-licentie ontbreekt.");

console.log(
  `Data geldig en deterministisch: ${catalog.cars.length} auto's, ${profiles.profiles.length} profielen.`,
);
