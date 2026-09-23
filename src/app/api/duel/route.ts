import { NextResponse } from "next/server";
import { getCatalog } from "@/catalogs/load";
import { DEFAULT_SPORT_ID } from "@/catalogs/registry";
import { duelWinner, scoreRound } from "@/engine";
import { resolveRoster } from "@/lib/roster";
import { hasStat } from "@/types";

export const dynamic = "force-dynamic";

/**
 * M6: dos jugadores, el mismo reto, el mismo móvil.
 *
 * Las dos plantillas se revelan de una vez y no en dos llamadas para que el
 * primero no vea sus cifras mientras el segundo todavía está fichando: en el
 * mismo dispositivo, lo que aparece en pantalla lo ven los dos.
 *
 * No guarda `Round`. Los dos comparten sesión y navegador, así que la ronda
 * del rival acabaría en el perfil de quien tenga la cuenta abierta.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  const { sport, stat, target, rosters } = body as {
    sport?: unknown;
    stat?: unknown;
    target?: unknown;
    rosters?: unknown;
  };
  const sportId = typeof sport === "string" ? sport : DEFAULT_SPORT_ID;
  const catalog = getCatalog(sportId);
  if (
    !catalog ||
    typeof stat !== "string" ||
    !hasStat(catalog, stat) ||
    typeof target !== "number" ||
    !Number.isFinite(target) ||
    target <= 0
  ) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  if (!Array.isArray(rosters) || rosters.length !== 2) {
    return NextResponse.json({ error: "rosters" }, { status: 400 });
  }

  const list = catalog.players[stat];
  const resolved = rosters.map(names => resolveRoster(list, names));
  const bad = resolved.find(r => !r.ok);
  if (bad && !bad.ok) {
    return NextResponse.json({ error: bad.error }, { status: 400 });
  }

  const [a, b] = resolved as Extract<(typeof resolved)[number], { ok: true }>[];
  const scoreA = scoreRound(a.total, target);
  const scoreB = scoreRound(b.total, target);

  return NextResponse.json({
    sides: [
      { values: a.values, photoIds: a.photoIds, total: a.total, ...scoreA },
      { values: b.values, photoIds: b.photoIds, total: b.total, ...scoreB },
    ],
    winner: duelWinner(scoreA, scoreB),
  });
}
