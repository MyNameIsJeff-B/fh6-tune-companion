import type { SpringSliderRange } from "../domain/types";

const KEY = "fh6-tune-companion:v1:car-overrides";

interface CarOverrides {
  springSliderRange?: SpringSliderRange;
}

type OverrideStore = Record<string, CarOverrides>;

const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export const carOverrideKey = (year: string, make: string, model: string) =>
  [year, make, model].map(normalise).join("|");

const loadStore = (): OverrideStore => {
  try {
    const value = localStorage.getItem(KEY);
    return value ? (JSON.parse(value) as OverrideStore) : {};
  } catch {
    return {};
  }
};

export function loadSpringSliderRange(
  year: string,
  make: string,
  model: string,
): SpringSliderRange | undefined {
  return loadStore()[carOverrideKey(year, make, model)]?.springSliderRange;
}

export function saveSpringSliderRange(
  year: string,
  make: string,
  model: string,
  springSliderRange?: SpringSliderRange,
) {
  const store = loadStore();
  const key = carOverrideKey(year, make, model);
  if (springSliderRange) {
    store[key] = { ...store[key], springSliderRange };
  } else {
    delete store[key];
  }
  localStorage.setItem(KEY, JSON.stringify(store));
}
