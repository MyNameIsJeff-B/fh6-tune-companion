import { ChevronDown, LockKeyhole } from "lucide-react";
import { useState } from "react";
import type { TuneSection } from "../domain/types";

export function TuneSections({ sections }: { sections: TuneSection[] }) {
  const [open, setOpen] = useState("tires");

  return (
    <div className="tune-sections">
      {sections.map((section, index) => {
        const expanded = open === section.id;
        return (
          <section
            className={`tune-section ${expanded ? "is-open" : ""} ${section.available ? "" : "is-locked"}`}
            key={section.id}
          >
            <button
              type="button"
              className="tune-section__header"
              onClick={() => section.available && setOpen(expanded ? "" : section.id)}
              aria-expanded={expanded}
            >
              <span className="tune-section__number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="tune-section__title">
                {section.label}
                <small>
                  {section.available ? section.summary : section.unavailableReason}
                </small>
              </span>
              {section.available ? (
                <ChevronDown className="tune-section__chevron" size={23} />
              ) : (
                <LockKeyhole size={18} />
              )}
            </button>
            {expanded && section.available ? (
              <div className="tune-section__body">
                <div className="value-table">
                  {section.values.length ? (
                    section.values.map((item) => (
                      <div className="value-row" key={item.key}>
                        <span>{item.label}</span>
                        <strong>
                          {item.value}
                          {item.unit ? <em>{item.unit}</em> : null}
                        </strong>
                        <i
                          className={`confidence-dot ${
                            item.confidence >= 0.75
                              ? "is-high"
                              : item.confidence >= 0.5
                                ? "is-medium"
                                : "is-low"
                          }`}
                          title={`${Math.round(item.confidence * 100)}% vertrouwen`}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="empty-row">Geen berekening beschikbaar.</div>
                  )}
                </div>
                <p className="section-tip">{section.tip}</p>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
