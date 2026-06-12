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
const baseCatalog = JSON.parse(
  await readFile("automation/data/catalog-base.json", "utf8"),
);
const profiles = JSON.parse(
  await readFile("public/data/build-profiles.json", "utf8"),
);
if (catalog.cars.length < 600) throw new Error("Onverwachte catalogusdaling.");
if (profiles.profiles.length < 600) throw new Error("Onverwachte profieldaling.");

const countKeys = (cars) => {
  const counts = new Map();
  for (const car of cars) {
    const key = `${car.year}|${car.make}|${car.model}`.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};
const baseCounts = countKeys(baseCatalog.cars);
const generatedCounts = countKeys(catalog.cars);
for (const [key, count] of generatedCounts) {
  if (count > (baseCounts.get(key) ?? 0)) {
    throw new Error(`Nieuwe dubbele auto-identiteit: ${key}`);
  }
}

for (const car of catalog.cars) {
  const key = `${car.year}|${car.make}|${car.model}`.toLowerCase();
  if (
    car.dataStatus === "identity-only" &&
    (car.drive || car.pi || car.weight)
  ) {
    throw new Error(`Identity-only auto bevat onbevestigde techniek: ${key}`);
  }
}

const license = await readFile("automation/data/TUNELAB-LICENSE.txt", "utf8");
if (!license.includes("MIT License")) throw new Error("TuneLab-licentie ontbreekt.");

console.log(
  `Data geldig en deterministisch: ${catalog.cars.length} auto's, ${profiles.profiles.length} profielen.`,
);
