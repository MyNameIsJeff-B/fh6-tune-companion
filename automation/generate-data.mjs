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

const base = JSON.parse(await readFile(path.join(dataRoot, "catalog-base.json"), "utf8"));
const tunelab = JSON.parse(await readFile(path.join(dataRoot, "tunelab-cars.json"), "utf8"));
const tunelabByKey = new Map(tunelab.cars.map((car) => [carKey(car), car]));
const cars = base.cars.map((car) => {
  const upstream = tunelabByKey.get(carKey(car));
  if (!upstream) return car;
  const promoteIdentityOnly =
    car.dataStatus === "identity-only" &&
    ["FWD", "RWD", "AWD"].includes(upstream.drive) &&
    Boolean(upstream.cls);
  if (car.dataStatus === "identity-only" && !promoteIdentityOnly) return car;
  return {
    ...car,
    drive: upstream.drive ?? car.drive,
    cls: upstream.cls ?? car.cls,
    weight: upstream.weight ?? car.weight,
    ev: upstream.ev ?? car.ev,
    pi: upstream.pi ?? car.pi,
    ...(upstream.fd === undefined ? {} : { fd: upstream.fd }),
    ...(upstream.gears === undefined ? {} : { gears: upstream.gears }),
    ...(promoteIdentityOnly
      ? {
          dataStatus: "technical",
          provenance: [
            ...new Set([...(car.provenance ?? []), "tunelab"]),
          ],
        }
      : {}),
  };
});
const catalog = {
  version: Number(base.version ?? 1),
  updated: base.updated,
  generated: base.updated,
  extractorVersion: 1,
  sources: {
    identity: "automation/data/catalog-base.json",
    technical: `TuneLab ${tunelab.version ?? "unknown"} (${tunelab.updated ?? "unknown"})`,
  },
  cars,
};
await writeFile(path.join(publicRoot, "cars.json"), `${JSON.stringify(catalog)}\n`);

const rows = parseCsv(
  (await readFile(path.join(dataRoot, "build-recommendations.csv"), "utf8"))
    .replace(/^\uFEFF/, ""),
);
const profiles = rows.map((row) => ({
  year: fixMojibake(row.year),
  make: fixMojibake(row.make),
  model: fixMojibake(row.car_name).replace(
    new RegExp(`^${row.year.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+${row.make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`),
    "",
  ),
  carType: fixMojibake(row.car_type),
  stockClass: fixMojibake(row.stock_class),
  stockPi: Number(row.stock_pi) || 0,
  stockDrive: fixMojibake(row.drivetrain_stock),
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
