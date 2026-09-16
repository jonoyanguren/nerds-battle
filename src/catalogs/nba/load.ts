import generated from "../../data.generated.json";
import type { Catalog, Player } from "../../types";
import { NBA_SPORT, NBA_STATS } from "./sport";

type GeneratedPlayer = { name: string; value: number; nbaId: number };

const raw = generated.players as Record<string, GeneratedPlayer[]>;

const players: Record<string, Player[]> = {};
for (const [statId, list] of Object.entries(raw)) {
  players[statId] = list.map(p => ({
    name: p.name,
    value: p.value,
    photoId: String(p.nbaId),
  }));
}

export function loadNba(): Catalog {
  return {
    sport: NBA_SPORT,
    stats: NBA_STATS,
    players,
    updatedAt: generated.updatedAt,
  };
}
