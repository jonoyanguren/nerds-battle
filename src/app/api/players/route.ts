import { NextResponse } from "next/server";
import { PLAYERS } from "@/data";
import { fold } from "@/format";
import { isStatId } from "@/types";

export const dynamic = "force-dynamic";

const LIMIT = 40;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stat = searchParams.get("stat") ?? "";
  const q = searchParams.get("q") ?? "";
  if (!isStatId(stat)) {
    return NextResponse.json({ error: "stat" }, { status: 400 });
  }
  const needle = fold(q.trim());
  if (!needle) {
    return NextResponse.json({ players: [] });
  }
  const players = PLAYERS[stat]
    .map((p, i) => ({ name: p.name, nbaId: p.nbaId, rank: i + 1 }))
    .filter(p => fold(p.name).includes(needle))
    .slice(0, LIMIT);
  return NextResponse.json({ players });
}
