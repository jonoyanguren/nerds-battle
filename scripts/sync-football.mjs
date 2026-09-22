/**
 * Catálogo de fútbol. Dos fuentes, las dos abiertas:
 *
 *   selecciones → martj42/international_results (GitHub). Goles desde 1916.
 *   clubes      → dcaribou/transfermarkt-datasets. Goles, asistencias y
 *                 partidos por competición.
 *
 * Uso:
 *   npm run sync:football          analiza e imprime el informe
 *   npm run sync:football -- --write   además escribe src/football.generated.json
 *
 * El informe va antes que el archivo a propósito: las cifras hay que verlas
 * para elegir categorías. Una estadística con objetivos de 30 castiga fallar
 * por uno con 160 puntos; otra con objetivos de 150 se juega como la NBA.
 *
 * Si algo falla, no se toca el JSON anterior.
 */
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { writeFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "football.generated.json");
const TMP = `${OUT}.tmp`;
const WRITE = process.argv.includes("--write");

const TM = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data";
const INTL = "https://raw.githubusercontent.com/martj42/international_results/master/goalscorers.csv";

/** Cuántos entran por estadística. Como la NBA. */
const TOP = 3000;
/** Por debajo de esto una estadística no da para jugar. */
const MIN_PLAYERS = 300;

/**
 * Las categorías que entran en el catálogo, con su etiqueta.
 * Vacío a propósito: se rellena cuando veamos el informe. Elegir a ciegas es
 * como se acaba metiendo una estadística que castiga fallar por uno.
 */
const CATEGORIAS = [];

const log = (...a) => console.log(...a);
const add = (map, key, n = 1) => map.set(key, (map.get(key) || 0) + n);
const ranking = map => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/** Divide una línea CSV respetando las comillas. */
function splitCsv(line) {
  const out = [];
  let field = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { out.push(field); field = ""; }
    else field += c;
  }
  out.push(field);
  return out;
}

/**
 * Lee un CSV remoto línea a línea, descomprimiendo si hace falta.
 * En streaming porque `appearances` son casi dos millones de filas.
 */
async function eachRow(url, onRow) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  let stream = Readable.fromWeb(res.body);
  if (url.endsWith(".gz")) stream = stream.pipe(createGunzip());

  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let head = null;
  let rows = 0, descuadradas = 0;
  for await (const line of rl) {
    if (!line) continue;
    const cells = splitCsv(line);
    if (!head) { head = cells; continue; }
    if (cells.length !== head.length) { descuadradas++; continue; }
    const row = {};
    for (let i = 0; i < head.length; i++) row[head[i]] = cells[i];
    onRow(row);
    rows++;
  }
  return { columns: head ?? [], rows, descuadradas };
}

/** ¿Existe esta URL? Se comprueba antes de leer para no tener que reintentar. */
async function existe(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return true;
    // Algunos alojamientos no responden a HEAD: se prueba con un rango mínimo.
    const r2 = await fetch(url, { headers: { Range: "bytes=0-64" } });
    return r2.ok;
  } catch {
    return false;
  }
}

/**
 * Lee una tabla del dataset. Elige `.csv.gz` o `.csv` ANTES de empezar a leer:
 * si se intentara una y se reintentara la otra a media lectura, los
 * contadores ya tendrían filas dentro y saldrían cifras duplicadas.
 */
async function eachTable(name, onRow) {
  for (const url of [`${TM}/${name}.csv.gz`, `${TM}/${name}.csv`]) {
    if (!(await existe(url))) continue;
    const r = await eachRow(url, onRow);
    log(`   ${name}: ${r.rows.toLocaleString("es-ES")} filas` +
        (r.descuadradas ? ` (${r.descuadradas} descuadradas)` : "") +
        `  [${url.split("/").pop()}]`);
    return r;
  }
  throw new Error(`No se encontró la tabla ${name} en ${TM}`);
}

/** Cómo de jugable es una estadística: simula objetivos como hace el motor. */
function diagnostico(lista) {
  const pool = lista.slice(0, 150);
  if (pool.length < 5) return null;
  const sims = [];
  for (let k = 0; k < 2000; k++) {
    const idx = new Set();
    while (idx.size < 5) idx.add(Math.floor(Math.random() * pool.length));
    sims.push([...idx].reduce((a, i) => a + pool[i][1], 0));
  }
  sims.sort((a, b) => a - b);
  const p50 = sims[Math.floor(sims.length / 2)];
  return {
    p10: sims[Math.floor(sims.length * 0.1)],
    p50,
    p90: sims[Math.floor(sims.length * 0.9)],
    // Puntos que cuesta fallar por una unidad. Por encima de ~50 la
    // estadística castiga demasiado para lo poco que se puede afinar.
    costeDeUno: p50 ? Math.round(1000 * (5 / p50)) : Infinity,
    ajusteFino: lista.filter(([, v]) => v === 1).length,
  };
}

// ------------------------------------------------------------------- fuentes

/** Goles con la selección, desde 1916. Fuente ya comprobada. */
async function selecciones() {
  log("\n▪ Selecciones (martj42/international_results)");
  const goles = new Map();
  let min = "9999", max = "0000";
  const r = await eachRow(INTL, row => {
    if (String(row.own_goal).toUpperCase() === "TRUE") return;
    if (!row.scorer) return;
    add(goles, row.scorer);
    if (row.date && row.date < min) min = row.date;
    if (row.date && row.date > max) max = row.date;
  });
  log(`   ${r.rows.toLocaleString("es-ES")} goles · ${goles.size.toLocaleString("es-ES")} goleadores · ${min} → ${max}`);
  return { stats: { SEL_gol: ranking(goles) }, hasta: max };
}

/** Goles, asistencias y partidos por competición de club. */
async function clubes() {
  log("\n▪ Clubes (transfermarkt-datasets)");

  const nombreComp = new Map();
  try {
    await eachTable("competitions", row => {
      const id = row.competition_id;
      if (id) nombreComp.set(id, row.name || row.competition_code || "");
    });
  } catch {
    log("   (sin tabla de competiciones: se usarán los códigos tal cual)");
  }

  const goles = new Map(), asist = new Map(), partidos = new Map(), porComp = new Map();
  let minFecha = "9999", maxFecha = "0000", sinNombre = 0;

  await eachTable("appearances", row => {
    const comp = row.competition_id;
    const who = row.player_name;
    if (!comp) return;
    if (!who) { sinNombre++; return; }
    const key = `${comp}\u0000${who}`;
    add(partidos, key);
    const g = Number(row.goals) || 0;
    const a = Number(row.assists) || 0;
    if (g > 0) add(goles, key, g);
    if (a > 0) add(asist, key, a);
    add(porComp, comp);
    if (row.date && row.date < minFecha) minFecha = row.date;
    if (row.date && row.date > maxFecha) maxFecha = row.date;
  });

  log(`   fechas: ${minFecha} → ${maxFecha}`);
  if (sinNombre) log(`   filas sin nombre: ${sinNombre.toLocaleString("es-ES")}`);

  log("\n   competiciones con más apariciones:");
  for (const [comp, n] of ranking(porComp).slice(0, 20)) {
    log(`     ${comp.padEnd(8)} ${n.toLocaleString("es-ES").padStart(10)}  ${nombreComp.get(comp) ?? ""}`);
  }

  const salida = {};
  const reparte = (map, sufijo) => {
    for (const [key, v] of map) {
      const sep = key.indexOf("\u0000");
      const comp = key.slice(0, sep), who = key.slice(sep + 1);
      const id = `${comp}_${sufijo}`;
      (salida[id] ??= new Map()).set(who, v);
    }
  };
  reparte(goles, "gol");
  reparte(asist, "asi");
  reparte(partidos, "par");

  for (const id of Object.keys(salida)) salida[id] = ranking(salida[id]);
  return { salida, nombreComp, fechas: [minFecha, maxFecha] };
}

// -------------------------------------------------------------------- inform

function informe(stats, etiquetas) {
  const filas = [];
  for (const [id, lista] of Object.entries(stats)) {
    if (lista.length < MIN_PLAYERS) continue;
    const d = diagnostico(lista);
    if (d) filas.push({ id, lista, d });
  }
  filas.sort((a, b) => a.d.costeDeUno - b.d.costeDeUno);

  log("\n" + "=".repeat(78));
  log("CATEGORÍAS CANDIDATAS  (las mejores arriba)");
  log("coste/1 = puntos que cuesta fallar por una unidad. Cuanto más bajo, mejor.");
  log("=".repeat(78));
  for (const { id, lista, d } of filas) {
    const comp = id.slice(0, id.lastIndexOf("_"));
    const veredicto = d.costeDeUno <= 20 ? "BIEN " : d.costeDeUno <= 50 ? "justa" : "DURA ";
    log(`\n── ${id}   ${etiquetas.get(comp) ?? ""}`);
    log(`   [${veredicto}] jugadores ${lista.length.toLocaleString("es-ES").padStart(7)}` +
        `   objetivo ${d.p10}–${d.p90} (mediana ${d.p50})   coste/1 ${d.costeDeUno} pts`);
    log(`   líderes: ${lista.slice(0, 5).map(([n, v]) => `${n} ${v}`).join(" · ")}`);
    log(`   con 1 unidad (para afinar): ${d.ajusteFino.toLocaleString("es-ES")}`);
  }
  log("\n" + "=".repeat(78));
  log(`${filas.length} categorías con al menos ${MIN_PLAYERS} jugadores.`);
  log("Pásale esta salida a Claude para decidir cuáles entran.");
  log("=".repeat(78));
}

// ---------------------------------------------------------------------- main

const { stats: sel, hasta: fechaSelecciones } = await selecciones();

// Si la fuente de clubes no responde se sigue con lo que haya: el informe es
// exploratorio y media foto vale más que ninguna. Pero se dice bien alto,
// para que nadie confunda "no hay datos de liga" con "no existen".
let clu = {}, nombreComp = new Map(), fechaClubes = null;
try {
  const c = await clubes();
  clu = c.salida;
  nombreComp = c.nombreComp;
  fechaClubes = c.fechas[1];
} catch (e) {
  log(`\n⚠  No se pudo leer la fuente de clubes: ${e.message}`);
  log("   El informe sale solo con selecciones. Revisa la conexión y repite.");
}

const todas = { ...sel, ...clu };

informe(todas, nombreComp);

if (!WRITE) {
  log("\n(sin --write: no se ha escrito ningún archivo)");
  process.exit(0);
}

if (CATEGORIAS.length === 0) {
  log("\nNo hay categorías elegidas todavía: mira CATEGORIAS al principio del script.");
  log("No se escribe nada para no dejar un catálogo a medias.");
  process.exit(1);
}

const players = {};
for (const { id } of CATEGORIAS) {
  const lista = todas[id];
  if (!lista) throw new Error(`La categoría ${id} no existe en los datos.`);
  if (lista.length < MIN_PLAYERS) throw new Error(`${id}: solo ${lista.length} jugadores.`);
  players[id] = lista.slice(0, TOP).map(([name, value]) => ({ name, value }));
}

// La fecha que se enseña es la del DATO, no la de la descarga. La NBA puede
// poner el día en que corre el script porque baja cifras en vivo; aquí la
// fuente de clubes es una foto fija de julio de 2026, y poner la fecha de hoy
// sería decirle al jugador que las cifras están al día cuando no lo están.
// Se coge la MÁS ANTIGUA de las dos: el catálogo solo está al día hasta donde
// llega su fuente más rezagada. Poner la más reciente presumiría de una
// frescura que la mitad de las categorías no tiene.
const corte = [fechaSelecciones, fechaClubes].filter(Boolean).sort()[0];
const out = {
  updatedAt: corte ?? new Date().toISOString().slice(0, 10),
  source: "martj42/international_results + dcaribou/transfermarkt-datasets",
  players,
};
writeFileSync(TMP, `${JSON.stringify(out, null, 2)}\n`);
renameSync(TMP, OUT);
log(`\nOK ${OUT}  ${CATEGORIAS.length} categorías  updatedAt=${out.updatedAt}`);
