import type { TuneResult } from "../domain/types";

const KEY = "fh6-tune-companion:v1:tunes";

export function loadSavedTunes(): TuneResult[] {
  try {
    const value = localStorage.getItem(KEY);
    const tunes = value ? (JSON.parse(value) as TuneResult[]) : [];
    return tunes.map((item) => ({
      ...item,
      input: {
        ...item.input,
        season: item.input.season ?? "Summer",
      },
    }));
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
  incoming.forEach((item) =>
    byId.set(item.id, {
      ...item,
      input: {
        ...item.input,
        season: item.input.season ?? "Summer",
      },
    }),
  );
  const next = [...byId.values()].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function exportTune(result: TuneResult) {
  downloadJson(
    result,
    `${result.input.year}-${result.input.make}-${result.input.model}-${result.input.tuneMode}.json`,
  );
}

export function exportGarage(results: TuneResult[]) {
  downloadJson(results, `fh6-tune-companion-garage-${new Date().toISOString().slice(0, 10)}.json`);
}

export const garageAsJson = (results: TuneResult[]) =>
  JSON.stringify(results, null, 2);

const downloadJson = (value: TuneResult | TuneResult[], filename: string) => {
  const json = Array.isArray(value)
    ? garageAsJson(value)
    : JSON.stringify(value, null, 2);
  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/\s+/g, "-").toLowerCase();
  link.click();
  URL.revokeObjectURL(url);
};

const normalizedCarPart = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function tuneHistoryFor(
  results: TuneResult[],
  current: TuneResult,
): TuneResult[] {
  const currentKey = [
    current.input.year,
    current.input.make,
    current.input.model,
    current.input.tuneMode,
  ]
    .map(normalizedCarPart)
    .join(":");
  const byId = new Map(
    [current, ...results].map((item) => [item.id, item] as const),
  );
  return [...byId.values()]
    .filter(
      (item) =>
        [
          item.input.year,
          item.input.make,
          item.input.model,
          item.input.tuneMode,
        ]
          .map(normalizedCarPart)
          .join(":") === currentKey,
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function tuneAsText(result: TuneResult) {
  const lines = [
    `${result.input.year} ${result.input.make} ${result.input.model}`,
    `${result.input.carClass} ${result.input.pi} · ${result.input.driveType} · ${result.input.tuneMode} · ${result.input.season ?? "Summer"}`,
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
  if (result.techniqueTips?.length) {
    lines.push("PR STUNT-TECHNIEK");
    result.techniqueTips.forEach((tip, index) =>
      lines.push(`${index + 1}. ${tip}`),
    );
    lines.push("");
  }
  lines.push("Brake Balance: hogere % = meer front bias; 50% = gelijk.");
  if (result.testRun) {
    lines.push(
      "",
      "TESTRIT",
      `${result.testRun.location || "Locatie niet ingevuld"} · ${result.testRun.cleanLaps} schone ronden · ${result.testRun.inputDevice} · assists ${result.testRun.assists}`,
    );
    if (result.testRun.notes) lines.push(result.testRun.notes);
  }
  return lines.join("\n");
}
