import type { CarRecord } from "../domain/types";

interface RawCarsFile {
  version: number;
  generated?: string;
  extractorVersion?: number;
  cars: Array<Record<string, unknown>>;
}

let cache: CarRecord[] | null = null;

const normaliseDrive = (value: unknown): CarRecord["drive"] => {
  const drive = String(value ?? "").toUpperCase();
  return drive === "FWD" || drive === "RWD" || drive === "AWD"
    ? drive
    : undefined;
};

export async function loadCars(): Promise<CarRecord[]> {
  if (cache) return cache;
  const response = await fetch(`${import.meta.env.BASE_URL}data/cars.json`);
  if (!response.ok) throw new Error("Autodatabase kon niet worden geladen.");
  const raw = (await response.json()) as RawCarsFile;
  cache = raw.cars.map((car) => ({
    make: String(car.make ?? ""),
    model: String(car.model ?? ""),
    year: String(car.year ?? ""),
    drive: normaliseDrive(car.drive ?? car.drivetrain),
    cls: String(car.cls ?? car.class ?? ""),
    pi: Number(car.pi ?? 0),
    weight: Number(car.weight ?? 0),
    weightUnit: "kg",
    frontWeight: Number(car.frontWeight ?? car.weightDist ?? 0) || undefined,
    ev: Boolean(car.ev),
    dataStatus:
      car.dataStatus === "identity-only" || car.dataStatus === "official"
        ? car.dataStatus
        : "technical",
    provenance: Array.isArray(car.provenance)
      ? car.provenance.map(String)
      : undefined,
    fieldSources:
      car.fieldSources && typeof car.fieldSources === "object"
        ? Object.fromEntries(
            Object.entries(car.fieldSources).map(([field, source]) => [
              field,
              String(source),
            ]),
          )
        : undefined,
  }));
  return cache;
}
