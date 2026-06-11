import type { DriveType, TuneSection, TuneValue } from "../domain/types";

const get = (section: TuneSection, key: string): TuneValue | undefined =>
  section.values.find((item) => item.key === key);

const amount = (section: TuneSection, key: string): string =>
  String(get(section, key)?.value ?? "–");

export function refreshSectionSummaries(
  sections: TuneSection[],
  driveType: DriveType,
): TuneSection[] {
  return sections.map((section) => {
    switch (section.id) {
      case "tires": {
        const unit = get(section, "pressure-front")?.unit ?? "";
        section.summary = `${amount(section, "pressure-front")} / ${amount(section, "pressure-rear")} ${unit}`.trim();
        break;
      }
      case "gearing":
        section.summary = get(section, "final-drive")
          ? `FD ${amount(section, "final-drive")}`
          : "Niet berekend";
        break;
      case "alignment":
        section.summary = `${amount(section, "camber-front")}° / ${amount(section, "camber-rear")}°`;
        break;
      case "arb":
        section.summary = `${amount(section, "arb-front")} / ${amount(section, "arb-rear")}`;
        break;
      case "springs": {
        const front = get(section, "spring-front");
        const rear = get(section, "spring-rear");
        const unit = front?.unit ?? "";
        const frontPercent = front?.label.match(/\(([\d.]+%)\)/)?.[1];
        const rearPercent = rear?.label.match(/\(([\d.]+%)\)/)?.[1];
        const percentages =
          unit && frontPercent && rearPercent
            ? ` · ${frontPercent} / ${rearPercent}`
            : "";
        section.summary =
          `${amount(section, "spring-front")} / ${amount(section, "spring-rear")} ${unit}${percentages}`.trim();
        break;
      }
      case "damping":
        section.summary = `R ${amount(section, "rebound-front")}/${amount(section, "rebound-rear")} · B ${amount(section, "bump-front")}/${amount(section, "bump-rear")}`;
        break;
      case "aero":
        section.summary = section.values.length
          ? `${amount(section, "aero-front")} / ${amount(section, "aero-rear")} kg`
          : "Niet geïnstalleerd";
        break;
      case "brakes":
        section.summary = `${amount(section, "brake-balance")}% / ${amount(section, "brake-pressure")}%`;
        break;
      case "differential":
        section.summary =
          driveType === "AWD"
            ? `${amount(section, "diff-front-accel")}% / ${amount(section, "diff-rear-accel")}% / ${amount(section, "diff-center")}%`
            : `${amount(section, driveType === "FWD" ? "diff-front-accel" : "diff-rear-accel")}% accel`;
        break;
    }
    return section;
  });
}
