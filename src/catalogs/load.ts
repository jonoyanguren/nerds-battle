import type { Catalog } from "../types";
import { loadNba } from "./nba/load";
import { loadFootball } from "./futbol/load";
import { loadF1 } from "./f1/load";
import { DEFAULT_SPORT_ID } from "./registry";

const loaders: Record<string, () => Catalog> = {
  nba: loadNba,
  futbol: loadFootball,
  f1: loadF1,
};

export function getCatalog(sportId: string = DEFAULT_SPORT_ID): Catalog | null {
  const load = loaders[sportId];
  return load ? load() : null;
}
