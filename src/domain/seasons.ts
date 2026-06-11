import type { Season } from "./types";

export interface SeasonProfile {
  id: Season;
  conditions: string;
  guidance: string;
}

export const SEASONS: SeasonProfile[] = [
  {
    id: "Spring",
    conditions: "Mild and changeable, with Sakura scenery and possible wet roads.",
    guidance: "Keep wet-weather capability in reserve; do not assume every event is wet.",
  },
  {
    id: "Summer",
    conditions: "Hot conditions increase the chance of sustained tire heat.",
    guidance: "Use the dry baseline, then watch tire temperature on longer runs.",
  },
  {
    id: "Autumn",
    conditions: "Cooler and variable, so dry grip and wet readiness both matter.",
    guidance: "Prefer a versatile compound when an event can turn wet.",
  },
  {
    id: "Winter",
    conditions: "Cold conditions with snow in winter-specific events and areas.",
    guidance: "Select Snow surface only when the event actually contains snow or ice.",
  },
];

export const seasonProfile = (season?: Season) =>
  SEASONS.find((item) => item.id === season) ?? SEASONS[1];
