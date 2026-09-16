import type { LocalStats } from "./types";

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
