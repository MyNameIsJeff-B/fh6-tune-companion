import type { TuneResult } from "../domain/types";

const KEY = "fh6-tune-companion:v1:tunes";

export function loadSavedTunes(): TuneResult[] {
  try {
    const value = localStorage.getItem(KEY);
    return value ? (JSON.parse(value) as TuneResult[]) : [];
  } catch {
    return [];
  }
}

export function saveTune(result: TuneResult): TuneResult[] {
  const existing = loadSavedTunes();
  const next = [result, ...existing.filter((item) => item.id !== result.id)].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteTune(id: string): TuneResult[] {
  const next = loadSavedTunes().filter((item) => item.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function importTunes(json: string): TuneResult[] {
  const parsed = JSON.parse(json) as TuneResult | TuneResult[];
  const incoming = Array.isArray(parsed) ? parsed : [parsed];
  if (!incoming.every((item) => item.engineVersion && item.input && item.sections)) {
    throw new Error("Dit bestand bevat geen geldige FH6-tunes.");
  }
  const byId = new Map(loadSavedTunes().map((item) => [item.id, item]));
  incoming.forEach((item) => byId.set(item.id, item));
  const next = [...byId.values()].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function exportTune(result: TuneResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.input.year}-${result.input.make}-${result.input.model}-${result.input.tuneMode}.json`
    .replace(/\s+/g, "-")
    .toLowerCase();
  link.click();
  URL.revokeObjectURL(url);
}

export function tuneAsText(result: TuneResult) {
  const lines = [
    `${result.input.year} ${result.input.make} ${result.input.model}`,
    `${result.input.carClass} ${result.input.pi} · ${result.input.driveType} · ${result.input.tuneMode}`,
    `Model ${result.engineVersion} · vertrouwen ${Math.round(result.confidence * 100)}%`,
    "",
  ];
  result.sections
    .filter((section) => section.available && section.values.length)
    .forEach((section) => {
      lines.push(section.label.toUpperCase());
      section.values.forEach((item) =>
        lines.push(`${item.label}: ${item.value}${item.unit ? ` ${item.unit}` : ""}`),
      );
      lines.push("");
    });
  return lines.join("\n");
}
