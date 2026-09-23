import generated from "../../football.generated.json";
import { SLOTS } from "../../format";
import type { Catalog, Player } from "../../types";
import { FOOTBALL_SPORT, FOOTBALL_STATS } from "./sport";

type GeneratedPlayer = { name: string; value: number };

const raw = generated.players as Record<string, GeneratedPlayer[]>;

const players: Record<string, Player[]> = {};
for (const [statId, list] of Object.entries(raw)) {
  // Sin foto: `photoId` vacío hace que el hueco enseñe las iniciales en vez
  // de pedir una imagen que no existe.
  players[statId] = list.map(p => ({ name: p.name, value: p.value, photoId: "" }));
}

export function loadFootball(): Catalog {
  return {
    sport: FOOTBALL_SPORT,
    // Solo entran las categorías que el archivo trae de verdad y con
    // jugadores de sobra para una ronda. El motor da por hecho que puede
    // sacar cinco de la lista: con una categoría a medio generar se quedaría
    // buscando un quinto que no existe.
    stats: FOOTBALL_STATS.filter(s => (players[s.id]?.length ?? 0) >= SLOTS),
    players,
    updatedAt: generated.updatedAt,
  };
}
