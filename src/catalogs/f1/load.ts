import generated from "../../f1.generated.json";
import { SLOTS } from "../../format";
import type { Catalog, Player } from "../../types";
import { F1_SPORT, F1_STATS } from "./sport";

type GeneratedDriver = { name: string; value: number; photoId?: string };

const raw = generated.players as Record<string, GeneratedDriver[]>;

const players: Record<string, Player[]> = {};
for (const [statId, list] of Object.entries(raw)) {
  players[statId] = list.map(p => ({
    name: p.name,
    value: p.value,
    photoId: p.photoId ?? "",
  }));
}

export function loadF1(): Catalog {
  return {
    sport: F1_SPORT,
    // Igual que el fútbol: solo entran las categorías que el archivo trae
    // con pilotos de sobra. El motor da por hecho que puede sacar cinco.
    stats: F1_STATS.filter(s => (players[s.id]?.length ?? 0) >= SLOTS),
    players,
    updatedAt: generated.updatedAt,
  };
}
