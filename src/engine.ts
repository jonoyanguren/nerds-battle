import { SLOTS } from "./format";
import type { Catalog, Challenge, DuelWinner, RoundScore, Verdict } from "./types";

export { SLOTS } from "./format";

/** El buscador ve todo el pool; el objetivo se siembra solo del tramo alto. */
export const SEED_POOL = 150;

/** Un número en [0, 1). El diario pasará uno sembrado; el reto libre usa Math.random. */
export type Rng = () => number;

/** Mulberry32 a partir de un string. Misma semilla → misma secuencia. */
export function rngFromSeed(seed: string): Rng {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    a ^= seed.charCodeAt(i);
    a = Math.imul(a, 16777619);
  }
  a >>>= 0;
  return () => {
    a |= 0;
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Redondea a 3 cifras significativas: 46.291 -> 46.300 */
export function roundNice(n: number) {
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  return Math.round(n / mag) * mag;
}

/** Un reto siempre es alcanzable: el objetivo sale de 5 jugadores del tramo alto. */
export function makeChallenge(
  catalog: Catalog,
  prevStatId: string | null,
  rng: Rng = Math.random,
): Challenge {
  const pool = catalog.stats.filter(s => s.id !== prevStatId);
  const stats = pool.length > 0 ? pool : catalog.stats;
  const stat = stats[Math.floor(rng() * stats.length)];
  const list = catalog.players[stat.id];
  const seedFrom = Math.min(SEED_POOL, list.length);
  const idx = new Set<number>();
  while (idx.size < SLOTS) idx.add(Math.floor(rng() * seedFrom));
  const seed = [...idx].reduce((a, i) => a + list[i].value, 0);
  return { sport: catalog.sport, stat, target: roundNice(seed) };
}

export const VERDICTS: Verdict[] = [
  { max: 0.01, title: "Nerd supremo", line: "Menos de un 1% de error. Esto no es suerte." },
  { max: 0.03, title: "Enciclopedia", line: "Te sabes los números, no solo los nombres." },
  { max: 0.07, title: "Buen ojo", line: "Ahí o ahí. Un jugador más fino y la clavas." },
  { max: 0.15, title: "Aficionado", line: "Sabes quién es quién, pero no cuánto." },
  { max: Infinity, title: "Fuera de rango", line: "Te has ido lejos. Mira las cifras y vuelve." },
];

export function scoreRound(total: number, target: number): RoundScore {
  const diff = total - target;
  const err = Math.abs(diff) / target;
  const points = Math.max(0, Math.round(1000 * (1 - err * 5)));
  const verdict = VERDICTS.find(v => err <= v.max) ?? VERDICTS[VERDICTS.length - 1];
  return { diff, err, points, verdict };
}

/**
 * Duelo al mismo reto: gana quien menos error tenga (`docs/game-design.md`).
 *
 * Se compara el error y no los puntos porque los puntos tienen suelo en 0:
 * dos plantillas malísimas empatarían a cero aunque una esté mucho más cerca.
 *
 * `null` es empate: misma plantilla, o dos desvíos iguales en sentidos
 * opuestos (uno se pasa un 4%, el otro se queda un 4% corto).
 */
export function duelWinner(a: RoundScore, b: RoundScore): DuelWinner {
  if (a.err < b.err) return 1;
  if (b.err < a.err) return 2;
  return null;
}
