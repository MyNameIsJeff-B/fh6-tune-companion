import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile("automation/sources.json", "utf8"));
const requiredIds = [
  "forza-official-news",
  "tunelab-releases",
  "forza-release-notes",
  "forza-dataout-doc",
  "forza-guide-cheatsheet",
  "manteomax-fh6",
  "optn-fh6",
  "fatty-changelog",
  "forzafire-guides",
  "forzatune-horizon-guide",
  "reddit-forzahorizon",
  "sepi-youtube",
  "hokihoshi-youtube",
];
const tiers = new Set(["data-update", "review-required", "signal"]);
const ids = new Set();

for (const source of config.sources ?? []) {
  if (!source.id || ids.has(source.id)) throw new Error(`Ongeldig of dubbel source id: ${source.id}`);
  if (!tiers.has(source.tier)) throw new Error(`Ongeldige tier voor ${source.id}`);
  if (!source.kind || (!source.url && !source.urls)) throw new Error(`Onvolledige bron: ${source.id}`);
  ids.add(source.id);
}
for (const id of requiredIds) {
  if (!ids.has(id)) throw new Error(`Verplichte bron ontbreekt: ${id}`);
}
console.log(`Bronconfiguratie geldig: ${ids.size} bronnen.`);
