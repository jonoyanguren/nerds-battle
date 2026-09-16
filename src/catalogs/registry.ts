import { NBA_SPORT } from "./nba/sport";
import type { Sport } from "../types";

/** Solo meta. Importable desde el cliente: no tira del JSON de cifras. */
export const SPORTS: Sport[] = [NBA_SPORT];

export const DEFAULT_SPORT_ID = NBA_SPORT.id;

export function getSport(id: string): Sport | undefined {
  return SPORTS.find(s => s.id === id);
}
