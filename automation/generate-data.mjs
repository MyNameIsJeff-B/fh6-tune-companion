import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(root, "automation", "data");
const publicRoot = path.join(root, "public", "data");

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }
  if (value || row.length) rows.push([...row, value]);
  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
};

const split = (value = "") =>
  value.split(";").map((item) => item.trim()).filter(Boolean);
const fixMojibake = (value) =>
  /Ã|Â/.test(value)
    ? Buffer.from(value, "latin1").toString("utf8")
    : value;
const normalise = (value) =>
  String(value ?? "").toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const carKey = (car) => `${car.year}|${normalise(car.make)}|${normalise(car.model)}`;

const tunelab = JSON.parse(await readFile(path.join(dataRoot, "tunelab-cars.json"), "utf8"));
const technicalOverrides = JSON.parse(
  await readFile(path.join(dataRoot, "technical-overrides.json"), "utf8"),
);
const overridesByKey = new Map(
  technicalOverrides.overrides.map((override) => [carKey(override), override]),
);
const rows = parseCsv(
  (await readFile(path.join(dataRoot, "build-recommendations.csv"), "utf8"))
    .replace(/^\uFEFF/, ""),
);
const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const officialModel = (row) =>
  fixMojibake(row.car_name).replace(
    new RegExp(
      `^${escapeRegExp(row.year)}\\s+${escapeRegExp(row.make)}\\s+`,
    ),
    "",
  );
const technicalScore = (candidate, official) => {
  let score = 0;
  if (normalise(candidate.make) === normalise(official.make)) score += 20;
  if (normalise(candidate.model) === normalise(official.model)) score += 30;
  if (candidate.cls === official.cls) score += 10;
  if (Number(candidate.pi) === official.pi) score += 20;
  if (candidate.drive === official.fallbackDrive) score += 8;
  if (Number(candidate.weight) > 0) score += 4;
  if (candidate.fd !== undefined) score += 2;
  if (candidate.gears !== undefined) score += 2;
  return score;
};
const technicalCandidates = (official) =>
  tunelab.cars
    .filter(
      (candidate) =>
        String(candidate.year) === official.year &&
        normalise(candidate.model) === normalise(official.model),
    )
    .sort(
      (left, right) =>
        technicalScore(right, official) - technicalScore(left, official),
    );
const cars = rows.map((row) => {
  const fallbackDrive = fixMojibake(row.drivetrain_stock);
  const official = {
    make: fixMojibake(row.make),
    model: officialModel(row),
    year: fixMojibake(row.year),
    cls: fixMojibake(row.stock_class),
    pi: Number(row.stock_pi) || 0,
    fallbackDrive,
  };
  const upstream = technicalCandidates(official)[0];
  const override = overridesByKey.get(carKey(official));
  const currentDrive = ["FWD", "RWD", "AWD"].includes(upstream?.drive)
    ? upstream.drive
    : undefined;
  const legacyDrive = ["FWD", "RWD", "AWD"].includes(fallbackDrive)
    ? fallbackDrive
    : undefined;
  const overrideDrive = ["FWD", "RWD", "AWD"].includes(override?.fields?.drive)
    ? override.fields.drive
    : undefined;
  const drive = overrideDrive ?? currentDrive ?? legacyDrive;
  const technicalSources = [
    ...(overrideDrive ? [override.sourceId] : []),
    ...(upstream ? ["tunelab-v7"] : []),
    ...(!upstream && legacyDrive ? ["tunelab-v6-fuzzy"] : []),
  ];
  const fieldSources = {
    identity: "forza-official",
    cls: "forza-official",
    pi: "forza-official",
    ...(drive
      ? {
          drive: overrideDrive
            ? override.sourceId
            : currentDrive
              ? "tunelab-v7"
              : "tunelab-v6-fuzzy",
        }
      : {}),
    ...(Number(upstream?.weight) > 0 ? { weight: "tunelab-v7" } : {}),
    ...(upstream?.fd === undefined ? {} : { fd: "tunelab-v7" }),
    ...(upstream?.gears === undefined ? {} : { gears: "tunelab-v7" }),
    ...(upstream?.ev ? { ev: "tunelab-v7" } : {}),
  };
  return {
    make: official.make,
    model: official.model,
    year: official.year,
    drive,
    cls: official.cls,
    weight: Number(upstream?.weight) || 0,
    ev: Boolean(upstream?.ev),
    pi: official.pi,
    ...(upstream?.fd === undefined ? {} : { fd: upstream.fd }),
    ...(upstream?.gears === undefined ? {} : { gears: upstream.gears }),
    dataStatus: technicalSources.length ? "technical" : "official",
    provenance: ["forza-official", ...technicalSources],
    fieldSources,
  };
});
const catalog = {
  version: 8,
  updated: "2026-06-12",
  generated: "2026-06-12",
  extractorVersion: 3,
  sources: {
    roster: "Official Forza Horizon 6 Car List (618 rows, updated 2026-05-19)",
    rosterCrossChecks: [
      "FH6Hub car list (checked 2026-05-21)",
      "FH6Cars official-row mirror (checked 2026-05-22)",
      "PC Gamer 618-car list (published 2026-05-21)",
    ],
    technical: {
      current: `TuneLab ${tunelab.version ?? "unknown"} (${tunelab.updated ?? "unknown"})`,
      fallback: "TuneLab v6 fuzzy matches from the local combined lookup",
      overrides: "automation/data/technical-overrides.json",
      policy: "Technical fields are optional and retain per-field provenance.",
    },
  },
  cars,
};
await writeFile(path.join(publicRoot, "cars.json"), `${JSON.stringify(catalog)}\n`);

const profiles = rows.map((row) => ({
  year: fixMojibake(row.year),
  make: fixMojibake(row.make),
  model: officialModel(row),
  carType: fixMojibake(row.car_type),
  stockClass: fixMojibake(row.stock_class),
  stockPi: Number(row.stock_pi) || 0,
  stockDrive: cars.find(
    (car) =>
      car.year === fixMojibake(row.year) &&
      normalise(car.make) === normalise(fixMojibake(row.make)) &&
      normalise(car.model) === normalise(officialModel(row)),
  )?.drive,
  preset: fixMojibake(row.recommended_preset),
  roles: split(row.primary_roles).map(fixMojibake),
  order: row.upgrade_order
    .split(">")
    .map((item) => fixMojibake(item.trim()))
    .filter(Boolean),
  required: split(row.required_adjustable_parts).map(fixMojibake),
  optional: split(row.optional_parts).map(fixMojibake),
  avoid: split(row.avoid).map(fixMojibake),
  note: fixMojibake(row.ai_notes),
  risks: split(row.risk_flags).map(fixMojibake),
}));
const buildProfiles = {
  version: "fh6-build-profiles-2026-06-11",
  source: "automation/data/build-recommendations.csv",
  generated: "2026-06-11",
  extractorVersion: 1,
  profiles,
};
await writeFile(
  path.join(publicRoot, "build-profiles.json"),
  `${JSON.stringify(buildProfiles)}\n`,
);
console.log(`Generated ${cars.length} cars and ${profiles.length} build profiles.`);
