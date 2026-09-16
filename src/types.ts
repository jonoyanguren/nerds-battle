export type Sport = {
  id: string;
  name: string;
  scope: string;
  logo: string;
  photoUrl: string;
};

export type Stat = {
  id: string;
  label: string;
  note: string;
};

export type Player = {
  name: string;
  value: number;
  photoId: string;
};

export type CatalogPlayer = {
  name: string;
  photoId: string;
  rank: number;
};

export type RosterPick = CatalogPlayer & { value?: number };

export type Catalog = {
  sport: Sport;
  stats: Stat[];
  players: Record<string, Player[]>;
  updatedAt: string;
};

export type Challenge = {
  sport: Sport;
  stat: Stat;
  target: number;
};

export type ChallengePayload = Challenge & {
  updatedAt: string;
  poolSize: number;
};

export type Verdict = {
  max: number;
  title: string;
  line: string;
};

export type RoundScore = {
  diff: number;
  err: number;
  points: number;
  verdict: Verdict;
};

export type LocalStats = {
  rounds: number;
  best: number;
  sum: number;
};

export type Phase = "picking" | "revealing" | "done";

export function hasStat(catalog: Catalog, statId: string): boolean {
  return Boolean(catalog.stats.some(s => s.id === statId) && catalog.players[statId]);
}
