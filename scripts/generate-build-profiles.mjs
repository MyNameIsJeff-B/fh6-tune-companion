import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(
  scriptDir,
  "../../data/derived/car_build_recommendations.csv",
);
const outputPath = path.resolve(
  scriptDir,
  "../public/data/build-profiles.json",
);

function parseCsv(text) {
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
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
}

const split = (value) =>
  value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fixMojibake = (value) =>
  /Ã|Â/.test(value) ? Buffer.from(value, "latin1").toString("utf8") : value;

const rows = parseCsv((await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, ""));
const profiles = rows.map((row) => ({
  year: fixMojibake(row.year),
  make: fixMojibake(row.make),
  model: fixMojibake(row.car_name).replace(
    new RegExp(`^${escapeRegExp(row.year)}\\s+${escapeRegExp(row.make)}\\s+`),
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

await writeFile(
  outputPath,
  `${JSON.stringify({
    version: "fh6-build-profiles-2026-06-11",
    source: "derived/car_build_recommendations.csv",
    generated: "2026-06-11",
    profiles,
  })}\n`,
  "utf8",
);

console.log(`Wrote ${profiles.length} build profiles to ${outputPath}`);
