import { NextResponse } from "next/server";
import { PLAYERS } from "@/data";
import { SLOTS, scoreRound } from "@/engine";
import { isStatId } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  const { stat, names, target } = body as {
    stat?: unknown;
    names?: unknown;
    target?: unknown;
  };
  if (typeof stat !== "string" || !isStatId(stat) || typeof target !== "number" || !Number.isFinite(target)) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  if (!Array.isArray(names) || names.length !== SLOTS || names.some(n => typeof n !== "string")) {
    return NextResponse.json({ error: "names" }, { status: 400 });
  }
  const typedNames = names as string[];
  if (new Set(typedNames).size !== SLOTS) {
    return NextResponse.json({ error: "duplicate" }, { status: 400 });
  }
  const list = PLAYERS[stat];
  const values: number[] = [];
  for (const name of typedNames) {
    const player = list.find(p => p.name === name);
    if (!player) {
      return NextResponse.json({ error: "unknown player" }, { status: 400 });
    }
    values.push(player.value);
  }
  const total = values.reduce((a, b) => a + b, 0);
  const score = scoreRound(total, target);
  return NextResponse.json({ values, total, ...score });
}
