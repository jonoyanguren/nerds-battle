export type StatId = "pts" | "trb" | "ast" | "blk" | "stl" | "fg3";

export type Player = {
  name: string;
  value: number;
  nbaId: number;
};

export type Stat = {
  id: StatId;
  label: string;
  note: string;
};

export type Challenge = {
  stat: Stat;
  target: number;
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
