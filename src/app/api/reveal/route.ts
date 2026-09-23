import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCatalog } from "@/catalogs/load";
import { DEFAULT_SPORT_ID } from "@/catalogs/registry";
import { scoreRound } from "@/engine";
import { resolveRoster } from "@/lib/roster";
import { saveRound } from "@/lib/rounds";
import { hasStat } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  const { sport, stat, names, target } = body as {
    sport?: unknown;
    stat?: unknown;
    names?: unknown;
    target?: unknown;
  };
  const sportId = typeof sport === "string" ? sport : DEFAULT_SPORT_ID;
  const catalog = getCatalog(sportId);
  if (
    !catalog ||
    typeof stat !== "string" ||
    !hasStat(catalog, stat) ||
    typeof target !== "number" ||
    !Number.isFinite(target)
  ) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  const roster = resolveRoster(catalog.players[stat], names);
  if (!roster.ok) {
    return NextResponse.json({ error: roster.error }, { status: 400 });
  }
  const { names: typedNames, values, photoIds, total } = roster;
  const score = scoreRound(total, target);

  const session = await auth();
  if (session?.user?.id) {
    try {
      await saveRound({
        userId: session.user.id,
        sport: sportId,
        stat,
        target,
        names: typedNames,
        photoIds,
        values,
        total,
        points: score.points,
        err: score.err,
        verdict: score.verdict.title,
      });
    } catch (error) {
      console.error("saveRound", error);
    }
  }

  return NextResponse.json({ values, total, ...score });
}
