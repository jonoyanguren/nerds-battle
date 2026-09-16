export type StatId = "pts" | "trb" | "ast" | "blk" | "stl" | "fg3";

export const STAT_IDS: StatId[] = ["pts", "trb", "ast", "blk", "stl", "fg3"];

export function isStatId(value: string): value is StatId {
  return (STAT_IDS as string[]).includes(value);
}

export type Player = {
  name: string;
  value: number;
  nbaId: number;
};

export type CatalogPlayer = {
  name: string;
  nbaId: number;
  rank: number;
};

export type RosterPick = CatalogPlayer & { value?: number };

export type Stat = {
  id: StatId;
  label: string;
  note: string;
};

export type Challenge = {
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
