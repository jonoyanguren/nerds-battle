import { getCatalog } from "@/catalogs/load";
import { getSport } from "@/catalogs/registry";
import { prisma } from "@/lib/prisma";
import type { ProfilePayload, ProfileRound } from "@/types";

const RECENT = 20;

export type NewRound = {
  userId: string;
  sport: string;
  stat: string;
  target: number;
  names: string[];
  photoIds: string[];
  values: number[];
  total: number;
  points: number;
  err: number;
  verdict: string;
};

export async function saveRound(round: NewRound) {
  await prisma.round.create({ data: round });
}

export async function getProfile(userId: string): Promise<ProfilePayload> {
  const rows = await prisma.round.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const bestByStat = new Map<string, { sport: string; stat: string; points: number }>();
  for (const row of rows) {
    const key = `${row.sport}:${row.stat}`;
    const prev = bestByStat.get(key);
    if (!prev || row.points > prev.points) {
      bestByStat.set(key, { sport: row.sport, stat: row.stat, points: row.points });
    }
  }

  const recent: ProfileRound[] = rows.slice(0, RECENT).map(row => {
    const catalog = getCatalog(row.sport);
    return {
      id: row.id,
      sport: row.sport,
      sportName: getSport(row.sport)?.name ?? row.sport,
      stat: row.stat,
      statLabel: catalog?.stats.find(s => s.id === row.stat)?.label ?? row.stat,
      target: row.target,
      names: row.names,
      photoIds: row.photoIds,
      values: row.values,
      total: row.total,
      points: row.points,
      err: row.err,
      verdict: row.verdict,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return {
    rounds: rows.length,
    best: rows.reduce((max, row) => Math.max(max, row.points), 0),
    sum: rows.reduce((acc, row) => acc + row.points, 0),
    bestByStat: [...bestByStat.values()]
      .map(item => {
        const catalog = getCatalog(item.sport);
        return {
          ...item,
          label: catalog?.stats.find(s => s.id === item.stat)?.label ?? item.stat,
        };
      })
      .sort((a, b) => b.points - a.points),
    recent,
  };
}
