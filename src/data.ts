import generated from "./data.generated.json";
import type { Player, Stat, StatId } from "./types";

/* ============================================================
   1. DATOS  —  el cron (npm run sync) pisa data.generated.json.
   El resto del juego consume PLAYERS[statId] = [{name, value, nbaId}].
   ============================================================ */

export const DATA_UPDATED_AT: string = generated.updatedAt;

export const STATS: Stat[] = [
  { id: "pts", label: "Puntos", note: "Puntos totales anotados en temporada regular." },
  { id: "trb", label: "Rebotes", note: "Rebotes totales, ofensivos y defensivos." },
  { id: "ast", label: "Asistencias", note: "Asistencias totales en temporada regular." },
  { id: "blk", label: "Tapones", note: "Tapones registrados desde que la NBA los contabiliza (1973-74)." },
  { id: "stl", label: "Robos", note: "Balones robados desde que la NBA los contabiliza (1973-74)." },
  { id: "fg3", label: "Triples", note: "Triples anotados desde que existe la línea (1979-80)." },
];

export const PLAYERS = generated.players as Record<StatId, Player[]>;
