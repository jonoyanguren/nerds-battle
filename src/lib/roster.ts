import { SLOTS } from "@/format";
import type { Player } from "@/types";

export type RosterResult =
  | { ok: true; names: string[]; values: number[]; photoIds: string[]; total: number }
  | { ok: false; error: "names" | "duplicate" | "unknown player" };

/**
 * Valida una plantilla que llega del cliente y le saca las cifras al catálogo.
 *
 * Lo usan `/api/reveal` (un jugador) y `/api/duel` (dos). Está aquí y no
 * duplicado en cada ruta porque es validación de entrada: dos copias acaban
 * separándose y una de ellas se queda corta.
 */
export function resolveRoster(list: Player[], names: unknown): RosterResult {
  if (!Array.isArray(names) || names.length !== SLOTS || names.some(n => typeof n !== "string")) {
    return { ok: false, error: "names" };
  }
  const typed = names as string[];
  if (new Set(typed).size !== SLOTS) {
    return { ok: false, error: "duplicate" };
  }
  const values: number[] = [];
  const photoIds: string[] = [];
  for (const name of typed) {
    const player = list.find(p => p.name === name);
    if (!player) {
      return { ok: false, error: "unknown player" };
    }
    values.push(player.value);
    photoIds.push(player.photoId);
  }
  return {
    ok: true,
    names: typed,
    values,
    photoIds,
    total: values.reduce((a, b) => a + b, 0),
  };
}
