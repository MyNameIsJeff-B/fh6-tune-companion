import type { DiagnosisId, TuneResult, TuneValue } from "../domain/types";
import { refreshSectionSummaries } from "./summaries";

export const DIAGNOSES: Array<{
  id: DiagnosisId;
  label: string;
  phase: string;
  description: string;
}> = [
  { id: "entry-understeer", label: "Onderstuur bij insturen", phase: "Entry", description: "De voorzijde wil niet happen." },
  { id: "mid-understeer", label: "Onderstuur middenbocht", phase: "Mid", description: "De auto loopt wijd op constante gasstand." },
  { id: "exit-understeer", label: "Onderstuur bij uitkomen", phase: "Exit", description: "De auto trekt naar buiten onder gas." },
  { id: "entry-oversteer", label: "Overstuur bij insturen", phase: "Entry", description: "De achterkant wordt los bij remmen of liften." },
  { id: "power-oversteer", label: "Power-overstuur", phase: "Exit", description: "De achterkant breekt uit onder gas." },
  { id: "twitchy", label: "Nerveus of snappy", phase: "Transition", description: "De auto reageert plotseling en onvoorspelbaar." },
  { id: "bouncy", label: "Stuiterig over hobbels", phase: "Bumps", description: "De banden verliezen contact op oneffenheden." },
  { id: "wheelspin", label: "Wielspin bij uitkomen", phase: "Exit", description: "Aangedreven banden raken grip kwijt." },
];

const mutate = (
  result: TuneResult,
  key: string,
  transform: (value: number) => number,
) => {
  const item = result.sections
    .flatMap((section) => section.values)
    .find((value) => value.key === key);
  if (!item || typeof item.value !== "number") return;
  item.value = Number(transform(item.value).toFixed(2));
  item.source = "user";
  item.confidence = Math.max(item.confidence, 0.82);
};

const firstExisting = (result: TuneResult, keys: string[]): TuneValue | undefined =>
  keys
    .map((key) =>
      result.sections.flatMap((section) => section.values).find((item) => item.key === key),
    )
    .find(Boolean);

export function applyDiagnosis(result: TuneResult, id: DiagnosisId): TuneResult {
  const next = structuredClone(result);
  next.id = crypto.randomUUID();
  next.parentRevisionId = result.id;
  next.createdAt = new Date().toISOString();
  next.revisionReason = DIAGNOSES.find((item) => item.id === id)?.label ?? id;

  switch (id) {
    case "entry-understeer":
      mutate(next, "arb-front", (v) => Math.max(1, v - 4));
      mutate(next, "camber-front", (v) => Math.max(-3, v - 0.2));
      break;
    case "mid-understeer":
      mutate(next, "arb-front", (v) => Math.max(1, v - 4));
      mutate(next, "pressure-front", (v) => v - (result.input.unitSystem === "metric" ? 0.07 : 1));
      break;
    case "exit-understeer":
      if (result.input.driveType === "FWD" || result.input.driveType === "AWD") {
        mutate(next, "diff-front-accel", (v) => Math.max(10, v - 10));
      } else {
        mutate(next, "arb-rear", (v) => Math.min(65, v + 3));
      }
      break;
    case "entry-oversteer":
      if (firstExisting(next, ["diff-rear-decel", "diff-front-decel"])) {
        mutate(next, result.input.driveType === "FWD" ? "diff-front-decel" : "diff-rear-decel", (v) => Math.min(40, v + 5));
      }
      mutate(next, "arb-rear", (v) => Math.max(1, v - 4));
      break;
    case "power-oversteer":
      mutate(next, "diff-rear-accel", (v) => Math.max(10, v - 10));
      mutate(next, "bump-rear", (v) => Math.max(1, v - 0.5));
      break;
    case "twitchy":
      mutate(next, "arb-front", (v) => Math.max(1, v - 4));
      mutate(next, "arb-rear", (v) => Math.max(1, v - 4));
      mutate(next, "bump-front", (v) => Math.max(1, v - 0.5));
      mutate(next, "bump-rear", (v) => Math.max(1, v - 0.5));
      break;
    case "bouncy":
      mutate(next, "bump-front", (v) => Math.max(1, v - 0.5));
      mutate(next, "bump-rear", (v) => Math.max(1, v - 0.5));
      mutate(next, "rebound-front", (v) => Math.max(1, v - 0.3));
      mutate(next, "rebound-rear", (v) => Math.max(1, v - 0.3));
      break;
    case "wheelspin":
      mutate(next, "diff-rear-accel", (v) => Math.max(10, v - 10));
      mutate(next, "diff-front-accel", (v) => Math.max(10, v - 8));
      break;
  }

  next.corrections = [
    ...next.corrections,
    `Rijfeedback toegepast: ${next.revisionReason}.`,
  ];
  next.sections = refreshSectionSummaries(next.sections, next.input.driveType);
  return next;
}
