/**
 * Catálogo de Fórmula 1 desde F1DB.
 *
 *   npm run sync:f1              genera src/f1.generated.json
 *   npm run sync:f1 -- --report  mide las categorías y no escribe nada
 *
 * Fuente: https://github.com/f1db/f1db — CC BY 4.0. Publica una release
 * después de cada carrera, así que esto SÍ puede tener cron, al revés que
 * el fútbol.
 *
 * Por qué estas cinco categorías y no las famosas: el informe las mide. En
 * la F1 pasa justo lo contrario que en la NBA —las cifras que la gente se
 * sabe (victorias, poles, campeonatos) son pequeñas, y fallar por una
 * cuesta 122, 109 y 500 puntos de 1000—. Las jugables son las de volumen.
 * Está todo en `docs/datos.md`; vuelve a pasar el informe antes de tocar
 * esta lista.
 *
 * Sin fotos: F1DB no trae retratos y no hay CDN abierto de pilotos. `Face`
 * enseña las iniciales con su tono estable, que para esto vale.
 */
import { createWriteStream, existsSync, mkdirSync, renameSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = "https://github.com/f1db/f1db/releases/latest/download/f1db-csv.zip";
const SEED_POOL = 150;   // el motor siembra el objetivo con el top 150
const SIMS = 4000;

const args = process.argv.slice(2);
const REPORT = args.includes("--report");
const outArg = args.find(a => a.startsWith("--out="));

/** Dónde escribir. Si el repo no está donde se cree, deja el archivo al lado. */
function destino() {
  if (outArg) return outArg.slice("--out=".length);
  const dentro = join(ROOT, "src");
  return existsSync(dentro) ? join(dentro, "f1.generated.json") : "f1.generated.json";
}

const log = (...a) => console.log(...a);

/* ------------------------------------------------------------------ *
 * Lector de ZIP mínimo.
 *
 * F1DB solo publica comprimido y no hay asset suelto (comprobado: los
 * .csv devuelven 404). Antes que añadir una dependencia o llamar a `unzip`
 * —que en Windows no está—, se leen a mano el directorio central y los
 * dos archivos que hacen falta. `zlib` ya viene con Node.
 * ------------------------------------------------------------------ */
function leerZip(buf, queremos) {
  // Fin del directorio central: se busca desde el final.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error("El zip no tiene directorio central (¿descarga cortada?)");

  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const salida = {};

  for (let i = 0; i < total; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Entrada de directorio corrupta");
    const metodo = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const nombre = buf.toString("utf8", p + 46, p + 46 + nameLen);

    if (queremos.includes(nombre)) {
      // Cabecera local: sus longitudes mandan sobre las del directorio.
      if (buf.readUInt32LE(offset) !== 0x04034b50) throw new Error(`Cabecera local mala en ${nombre}`);
      const lName = buf.readUInt16LE(offset + 26);
      const lExtra = buf.readUInt16LE(offset + 28);
      const ini = offset + 30 + lName + lExtra;
      const datos = buf.subarray(ini, ini + compressed);
      salida[nombre] = metodo === 0 ? datos : inflateRawSync(datos);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }

  const faltan = queremos.filter(n => !salida[n]);
  if (faltan.length) throw new Error(`El zip no trae: ${faltan.join(", ")}`);
  return salida;
}

/** CSV con comillas dobles y saltos de línea dentro de campo. */
function parseCSV(texto) {
  const filas = [];
  let campo = "", fila = [], enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') enComillas = false;
      else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const cab = filas.shift();
  return filas
    .filter(f => f.length === cab.length)
    .map(f => Object.fromEntries(cab.map((k, i) => [k, f[i]])));
}

/* ------------------------------------------------------------------ *
 * Categorías
 * ------------------------------------------------------------------ */

/** Las que salen directas de la tabla de pilotos. */
const DIRECTAS = [
  ["vueltas", "totalRaceLaps"],
  ["puntos", "totalPoints"],
  ["gp", "totalRaceStarts"],
];

/** Las que hay que contar sobre los resultados carrera a carrera. */
const DERIVADAS = ["terminadas", "abandonos"];

/** Todas las que se miden en el informe, jugables o no. Estar aquí no es
 *  estar dentro: el informe decide y `sport.ts` recoge el veredicto. */
const MEDIBLES = [
  ...DIRECTAS,
  ["podios", "totalPodiums"],
  ["victorias", "totalRaceWins"],
  ["poles", "totalPolePositions"],
  ["vueltasRapidas", "totalFastestLaps"],
  ["campeonatos", "totalChampionshipWins"],
];

const ETIQUETAS = {
  vueltas: "Vueltas completadas",
  puntos: "Puntos en toda su carrera",
  gp: "Grandes Premios disputados",
  terminadas: "Carreras terminadas",
  abandonos: "Abandonos",
  podios: "Podios",
  victorias: "Victorias",
  poles: "Pole positions",
  vueltasRapidas: "Vueltas rápidas",
  campeonatos: "Campeonatos",
};

const roundNice = n => {
  const mag = 10 ** Math.max(0, Math.floor(Math.log10(Math.abs(n) || 1)) - 2);
  return Math.round(n / mag) * mag;
};
const pct = (arr, q) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];

/** Lo que cuesta fallar por una unidad, que es lo que decide si una
 *  categoría es jugable. Mismo criterio que el informe del fútbol. */
function medir(lista) {
  const semilla = lista.slice(0, Math.min(SEED_POOL, lista.length));
  if (semilla.length < 5) return null;
  const objetivos = [];
  for (let i = 0; i < SIMS; i++) {
    let suma = 0;
    const usados = new Set();
    while (usados.size < 5) {
      const j = Math.floor(Math.random() * semilla.length);
      if (usados.has(j)) continue;
      usados.add(j);
      suma += semilla[j].value;
    }
    objetivos.push(roundNice(suma));
  }
  objetivos.sort((a, b) => a - b);
  const p50 = pct(objetivos, 0.5);
  return {
    pool: lista.length,
    p10: pct(objetivos, 0.1),
    p50,
    p90: pct(objetivos, 0.9),
    coste: p50 ? Math.round(1000 * (5 / p50)) : Infinity,
    lider: lista[0],
  };
}

async function main() {
  log(`Bajando ${RELEASE}`);
  const res = await fetch(RELEASE);
  if (!res.ok) throw new Error(`La release respondió ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  log(`  ${(zip.length / 1024 / 1024).toFixed(1)} MB`);

  const archivos = leerZip(zip, [
    "f1db-drivers.csv",
    "f1db-races.csv",
    "f1db-races-race-results.csv",
  ]);

  const pilotos = parseCSV(archivos["f1db-drivers.csv"].toString("utf8"));
  const carreras = parseCSV(archivos["f1db-races.csv"].toString("utf8"));
  const resultados = parseCSV(archivos["f1db-races-race-results.csv"].toString("utf8"));
  log(`  ${pilotos.length} pilotos · ${resultados.length} resultados de carrera`);

  const nombreDe = Object.fromEntries(pilotos.map(p => [p.id, p.name]));

  // Fecha del dato: la última carrera que ya tiene resultados. Poner la
  // fecha de hoy mentiría sobre hasta dónde llegan las cifras.
  const conResultados = new Set(resultados.map(r => r.raceId));
  const fechas = carreras.filter(c => conResultados.has(c.id)).map(c => c.date).filter(Boolean);
  fechas.sort();
  const updatedAt = fechas[fechas.length - 1] ?? new Date().toISOString().slice(0, 10);

  // Derivadas: abandonos y carreras terminadas, contando resultado a resultado.
  const cuenta = { terminadas: {}, abandonos: {} };
  for (const r of resultados) {
    if (!r.driverId) continue;
    const clave = r.reasonRetired && r.reasonRetired.trim() ? "abandonos" : (r.positionNumber ? "terminadas" : null);
    if (!clave) continue;
    cuenta[clave][r.driverId] = (cuenta[clave][r.driverId] ?? 0) + 1;
  }

  const listaDe = id => {
    const directa = MEDIBLES.find(([k]) => k === id);
    const bruto = DERIVADAS.includes(id)
      ? Object.entries(cuenta[id]).map(([driverId, value]) => ({ name: nombreDe[driverId] ?? driverId, value }))
      : pilotos.map(p => ({ name: p.name, value: Number(p[directa[1]]) }));
    return bruto
      .filter(p => p.name && Number.isFinite(p.value) && p.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const todas = [...MEDIBLES.map(([k]) => k), ...DERIVADAS];

  if (REPORT) {
    const filas = todas.map(id => ({ id, d: medir(listaDe(id)) })).filter(f => f.d);
    filas.sort((a, b) => a.d.coste - b.d.coste);
    log("");
    log("coste/1 = puntos que cuesta fallar por UNA unidad. Cuanto más bajo, mejor.");
    log("Criterio, el mismo que el fútbol: <=20 bien, <=50 justa, más = injugable.");
    log("");
    for (const { id, d } of filas) {
      const v = d.coste <= 20 ? "BIEN " : d.coste <= 50 ? "justa" : "DURA ";
      log(`  ${v}  ${ETIQUETAS[id].padEnd(28)} pool ${String(d.pool).padStart(4)}`);
      log(`         objetivo ${d.p10.toLocaleString("es-ES")}–${d.p90.toLocaleString("es-ES")}` +
          ` (mediana ${d.p50.toLocaleString("es-ES")})   coste/1 ${d.coste} pts`);
      log(`         líder: ${d.lider.name} ${d.lider.value.toLocaleString("es-ES")}`);
    }
    log("");
    log("No escribo nada: esto es solo el informe.");
    return;
  }

  // Las que entran de verdad. El orden es el del informe, de más a menos
  // jugable, y no cambia nada: está para que se lea igual que la tabla.
  const ELEGIDAS = ["vueltas", "puntos", "gp", "terminadas", "abandonos"];
  const players = {};
  for (const id of ELEGIDAS) {
    players[id] = listaDe(id).map(p => ({ name: p.name, value: p.value, photoId: "" }));
    log(`  ${ETIQUETAS[id].padEnd(28)} ${players[id].length} pilotos`);
  }

  const salida = destino();
  mkdirSync(dirname(salida), { recursive: true });
  const tmp = `${salida}.tmp`;
  writeFileSync(tmp, JSON.stringify({
    updatedAt,
    source: "F1DB (github.com/f1db/f1db), CC BY 4.0",
    players,
  }, null, 0));
  // Se escribe aparte y se renombra: si esto revienta a medias, el archivo
  // anterior sigue entero, igual que hace el sync de la NBA.
  renameSync(tmp, salida);
  log(`\nEscrito ${salida}  ·  datos hasta ${updatedAt}`);
}

main().catch(e => {
  console.error(`\nFalló: ${e.message}`);
  console.error("El JSON anterior no se ha tocado.");
  process.exit(1);
});
