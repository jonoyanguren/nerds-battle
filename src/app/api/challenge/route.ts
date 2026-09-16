import { NextResponse } from "next/server";
import { DATA_UPDATED_AT, PLAYERS } from "@/data";
import { makeChallenge } from "@/engine";
import { isStatId } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const prev =
    body && typeof body === "object" && "prevStatId" in body
      ? (body as { prevStatId: unknown }).prevStatId
      : null;
  const prevStatId = typeof prev === "string" && isStatId(prev) ? prev : null;
  const challenge = makeChallenge(prevStatId);
  return NextResponse.json({
    ...challenge,
    updatedAt: DATA_UPDATED_AT,
    poolSize: PLAYERS[challenge.stat.id].length,
  });
}
