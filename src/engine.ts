import { PLAYERS, STATS } from "./data";
import type { Challenge, LocalStats, RoundScore, StatId, Verdict } from "./types";

/* ============================================================
   2. MOTOR  —  funciones puras, sin React. Aquí vive el juego.
   ============================================================ */
export const SLOTS = 5;
/** El buscador ve todo el pool; el objetivo se siembra solo del tramo alto. */
export const SEED_POOL = 150;

export const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const fmt = (n: number) => n.toLocaleString("es-ES");

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Redondea a 3 cifras significativas: 46.291 -> 46.300 */
export function roundNice(n: number) {
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  return Math.round(n / mag) * mag;
}

/** Un reto siempre es alcanzable: el objetivo sale de 5 jugadores del tramo alto. */
export function makeChallenge(prevStatId: StatId | null): Challenge {
  const pool = STATS.filter(s => s.id !== prevStatId);
  const stat = pool[Math.floor(Math.random() * pool.length)];
  const list = PLAYERS[stat.id];
  const seedFrom = Math.min(SEED_POOL, list.length);
  const idx = new Set<number>();
  while (idx.size < SLOTS) idx.add(Math.floor(Math.random() * seedFrom));
  const seed = [...idx].reduce((a, i) => a + list[i].value, 0);
  return { stat, target: roundNice(seed) };
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

/* --- récord local, best-effort --- */
export const STORE_KEY = "nerds-battle-v1";

const EMPTY_STATS: LocalStats = { rounds: 0, best: 0, sum: 0 };

function isLocalStats(value: unknown): value is LocalStats {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.rounds === "number" &&
    typeof o.best === "number" &&
    typeof o.sum === "number"
  );
}

export const loadStats = (): LocalStats => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    return isLocalStats(raw) ? raw : EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
};

export const saveStats = (s: LocalStats) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
};
