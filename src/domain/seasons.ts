import type { Season } from "./types";

export interface SeasonProfile {
  id: Season;
  conditions: string;
  guidance: string;
}

export const SEASONS: SeasonProfile[] = [
  {
    id: "Spring",
    conditions: "Mild en wisselvallig, met mogelijke natte wegen.",
    guidance: "Houd wet-weather grip achter de hand; niet ieder Spring-event is nat.",
  },
  {
    id: "Summer",
    conditions: "Warm weer vergroot de kans op langdurig hoge tire temperatures.",
    guidance: "Gebruik de droge baseline en controleer tire temperatures tijdens langere runs.",
  },
  {
    id: "Autumn",
    conditions: "Koeler en wisselvallig, waardoor dry grip en wet-weather grip beide tellen.",
    guidance: "Kies een veelzijdige compound wanneer een Autumn-event nat kan worden.",
  },
  {
    id: "Winter",
    conditions: "Koude omstandigheden verlagen tire temperatures, ook op droog asfalt.",
    guidance: "Reken de eerste ronden op minder grip en langere braking distances. Een compound die op temperatuur komt kan sneller zijn; kies Snow alleen bij sneeuw of ijs.",
  },
];

export const seasonProfile = (season?: Season) =>
  SEASONS.find((item) => item.id === season) ?? SEASONS[1];
