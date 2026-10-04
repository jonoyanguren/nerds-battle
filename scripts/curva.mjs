/**
 * ¿La curva de puntuación es dura o blanda?
 *
 *   npm run curva
 *
 * Lee las rondas guardadas y cuenta cómo le va a la gente de verdad. El
 * criterio está fijado en `docs/tareas.md` ANTES de mirar ningún dato:
 *
 *   más del 40% de ceros       -> dura   -> bajar a x3
 *   más del 40% por encima 800 -> blanda -> subir a x7
 *   reparto, 10-20% de ceros   -> está bien
 *
 * Solo se guardan las rondas de quien entra con Google. Las de invitado
 * viven en el `localStorage` de su móvil y aquí no se ven: si el playtest
 * sale con pocas rondas, probablemente sea eso y no falta de gente.
 *
 * Lee con SQL en vez de Prisma porque el cliente generado es TypeScript y
 * esto es un script suelto. `pg` ya es dependencia del proyecto.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(join(ROOT, ".env"))) process.loadEnvFile(join(ROOT, ".env"));

const url = process.env.PRISMA_DIRECT_TCP_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Falta PRISMA_DIRECT_TCP_URL (o DATABASE_URL). Mira .env.example.");
  process.exit(1);
}

/** El multiplicador que hay hoy en `scoreRound`. */
const MULT = 5;

const pct = (n, total) => (total ? (n / total) * 100 : 0);
const fmtPct = n => `${n.toFixed(0)}%`;
const mediana = arr => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Qué puntuación habrían dado esos mismos errores con otro multiplicador. */
const conMultiplicador = (errores, mult) =>
  errores.map(e => Math.max(0, Math.round(1000 * (1 - e * mult))));

function reparto(puntos) {
  const tramos = [
    ["0 (fuera de rango)", p => p === 0],
    ["1-249", p => p > 0 && p < 250],
    ["250-649", p => p >= 250 && p < 650],
    ["650-849", p => p >= 650 && p < 850],
    ["850-949", p => p >= 850 && p < 950],
    ["950-1000", p => p >= 950],
  ];
  const total = puntos.length;
  return tramos.map(([label, test]) => {
    const n = puntos.filter(test).length;
    return { label, n, pct: pct(n, total) };
  });
}

function barra(porcentaje) {
  const n = Math.round(porcentaje / 2.5);
  return "█".repeat(n) + "·".repeat(Math.max(0, 40 - n));
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
} catch (e) {
  // Esto lo ejecuta una persona, no un servidor: un volcado de Node no le
  // dice qué hacer. El fallo casi siempre es el mismo —el `.env` apunta a
  // una base que no está— y conviene decirlo con todas las letras.
  console.error("No se pudo conectar con la base de datos.\n");
  console.error(`  ${e.message}\n`);
  console.error("Comprueba que el `.env` tiene las credenciales buenas:");
  console.error("  PRISMA_DIRECT_TCP_URL es la que usa este script.");
  console.error("  Si estás en local y apunta a 127.0.0.1, es que te falta");
  console.error("  la de producción, que es donde están las rondas de verdad.");
  process.exit(1);
}

try {
  const { rows } = await client.query(
    `SELECT sport, stat, points, err, target, total, "createdAt", "userId" FROM "Round" ORDER BY "createdAt"`
  );

  if (rows.length === 0) {
    console.log("No hay ninguna ronda guardada todavía.\n");
    console.log("Recuerda que solo se guardan las de quien entra con Google:");
    console.log("si tus colegas jugaron de invitados, sus rondas están en el");
    console.log("localStorage de su móvil y no llegan aquí.");
    process.exit(0);
  }

  const puntos = rows.map(r => r.points);
  const errores = rows.map(r => Number(r.err));
  const jugadores = new Set(rows.map(r => r.userId)).size;
  const ceros = puntos.filter(p => p === 0).length;
  const altos = puntos.filter(p => p >= 800).length;

  console.log("=".repeat(62));
  console.log(`${rows.length} rondas · ${jugadores} jugador${jugadores === 1 ? "" : "es"} · ` +
    `de ${rows[0].createdAt.toISOString().slice(0, 10)} a ${rows[rows.length - 1].createdAt.toISOString().slice(0, 10)}`);
  console.log("=".repeat(62));

  console.log("\nREPARTO DE PUNTUACIONES");
  for (const t of reparto(puntos)) {
    console.log(`  ${t.label.padEnd(20)} ${String(t.n).padStart(4)}  ${fmtPct(t.pct).padStart(4)}  ${barra(t.pct)}`);
  }

  console.log(`\n  error mediano: ${(mediana(errores) * 100).toFixed(1)}%`);
  console.log(`  puntos medianos: ${mediana(puntos)}`);

  console.log("\nPOR DEPORTE Y ESTADÍSTICA");
  const grupos = new Map();
  for (const r of rows) {
    const k = `${r.sport} · ${r.stat}`;
    (grupos.get(k) ?? grupos.set(k, []).get(k)).push(r);
  }
  for (const [k, list] of [...grupos.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const p = list.map(r => r.points);
    const z = p.filter(x => x === 0).length;
    console.log(`  ${k.padEnd(22)} ${String(list.length).padStart(4)} rondas  ` +
      `mediana ${String(mediana(p)).padStart(4)}  ceros ${fmtPct(pct(z, p.length)).padStart(4)}`);
  }

  console.log("\n" + "=".repeat(62));
  console.log("VEREDICTO  (criterio de docs/tareas.md, fijado antes de ver datos)");
  console.log("=".repeat(62));
  console.log(`  ceros:            ${fmtPct(pct(ceros, puntos.length))}  (dura si pasa del 40%)`);
  console.log(`  por encima de 800: ${fmtPct(pct(altos, puntos.length))}  (blanda si pasa del 40%)`);

  const esDura = pct(ceros, puntos.length) > 40;
  const esBlanda = pct(altos, puntos.length) > 40;
  console.log("");
  if (esDura && esBlanda) {
    console.log("  PARTIDA EN DOS: mucha gente a cero y mucha clavándolo.");
    console.log("  No es cuestión del multiplicador, sino de que hay dos tipos de");
    console.log("  jugador. Mira el desglose por estadística antes de tocar nada.");
  } else if (esDura) {
    console.log("  DURA. Bajar el multiplicador de 5 a 3 en `scoreRound`.");
  } else if (esBlanda) {
    console.log("  BLANDA. Subir el multiplicador de 5 a 7 en `scoreRound`.");
  } else {
    console.log("  ESTÁ BIEN. No tocar `scoreRound`.");
  }

  console.log("\nQUÉ PASARÍA CON OTRO MULTIPLICADOR  (mismos errores, otra fórmula)");
  console.log(`  ${"mult".padEnd(6)} ${"ceros".padStart(7)} ${">=800".padStart(7)} ${"mediana".padStart(8)}`);
  for (const m of [3, 4, MULT, 6, 7]) {
    const p = conMultiplicador(errores, m);
    const z = fmtPct(pct(p.filter(x => x === 0).length, p.length));
    const a = fmtPct(pct(p.filter(x => x >= 800).length, p.length));
    const marca = m === MULT ? "  <- el de ahora" : "";
    console.log(`  x${String(m).padEnd(5)} ${z.padStart(7)} ${a.padStart(7)} ${String(mediana(p)).padStart(8)}${marca}`);
  }

  if (rows.length < 50) {
    console.log(`\n⚠  Solo ${rows.length} rondas. Con menos de 50 el reparto baila mucho;`);
    console.log("   no cambies la curva todavía.");
  }
  console.log("");
} finally {
  await client.end();
}
