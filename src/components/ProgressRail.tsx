import { CarFront, Crosshair, Flag, Wrench } from "lucide-react";

const items = [
  { label: "Auto", icon: CarFront },
  { label: "Build", icon: Wrench },
  { label: "Doel", icon: Crosshair },
  { label: "Advies", icon: Flag },
];

export function ProgressRail({
  step,
  onStep,
}: {
  step: number;
  onStep: (step: number) => void;
}) {
  return (
    <nav className="progress-rail" aria-label="Tune stappen">
      {items.map((item, index) => {
        const Icon = item.icon;
        const enabled = index <= step;
        return (
          <button
            type="button"
            key={item.label}
            className={index === step ? "is-active" : index < step ? "is-done" : ""}
            onClick={() => enabled && onStep(index)}
            disabled={!enabled}
          >
            <Icon size={19} strokeWidth={2.3} />
            <span>{item.label}</span>
            <i />
          </button>
        );
      })}
    </nav>
  );
}
