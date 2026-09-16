import { NextResponse } from "next/server";
import { getCatalog } from "@/catalogs/load";
import { DEFAULT_SPORT_ID } from "@/catalogs/registry";
import { makeChallenge } from "@/engine";
import { hasStat } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const sportId =
    body && typeof body === "object" && "sportId" in body && typeof (body as { sportId: unknown }).sportId === "string"
      ? (body as { sportId: string }).sportId
      : DEFAULT_SPORT_ID;
  const prev =
    body && typeof body === "object" && "prevStatId" in body
      ? (body as { prevStatId: unknown }).prevStatId
      : null;
  const catalog = getCatalog(sportId);
  if (!catalog) {
    return NextResponse.json({ error: "sport" }, { status: 400 });
  }
  const prevStatId = typeof prev === "string" && hasStat(catalog, prev) ? prev : null;
  const challenge = makeChallenge(catalog, prevStatId);
  return NextResponse.json({
    ...challenge,
    updatedAt: catalog.updatedAt,
    poolSize: catalog.players[challenge.stat.id].length,
  });
}
