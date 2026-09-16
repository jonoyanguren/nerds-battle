import { NextResponse } from "next/server";
import { getCatalog } from "@/catalogs/load";
import { DEFAULT_SPORT_ID } from "@/catalogs/registry";
import { fold } from "@/format";
import { hasStat } from "@/types";

export const dynamic = "force-dynamic";

const LIMIT = 40;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sportId = searchParams.get("sport") ?? DEFAULT_SPORT_ID;
  const stat = searchParams.get("stat") ?? "";
  const q = searchParams.get("q") ?? "";
  const catalog = getCatalog(sportId);
  if (!catalog || !hasStat(catalog, stat)) {
    return NextResponse.json({ error: "sport/stat" }, { status: 400 });
  }
  const needle = fold(q.trim());
  if (!needle) {
    return NextResponse.json({ players: [] });
  }
  const players = catalog.players[stat]
    .map((p, i) => ({ name: p.name, photoId: p.photoId, rank: i + 1 }))
    .filter(p => fold(p.name).includes(needle))
    .slice(0, LIMIT);
  return NextResponse.json({ players });
}
