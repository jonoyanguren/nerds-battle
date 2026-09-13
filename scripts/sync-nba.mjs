/**
 * Cron del prototipo: top 2000 de carrera (NBA Stats) + nbaId para las fotos.
 * Si falla, no pisa el JSON anterior.
 *
 *   npm run sync
 */
import { writeFileSync, renameSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data.generated.json");
const TMP = `${OUT}.tmp`;
const TOP = 3000;

const STATS = {
  pts: { set: "PTSLeaders", field: "PTS" },
  trb: { set: "REBLeaders", field: "REB" },
  ast: { set: "ASTLeaders", field: "AST" },
  blk: { set: "BLKLeaders", field: "BLK" },
  stl: { set: "STLLeaders", field: "STL" },
  fg3: { set: "FG3MLeaders", field: "FG3M" },
};

const URL =
  `https://stats.nba.com/stats/alltimeleadersgrids` +
  `?LeagueID=00&PerMode=Totals&SeasonType=Regular+Season&TopX=${TOP}`;

const HEADERS = {
  Accept: "application/json",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};

function rowsOf(data, name) {
  const rs = data.resultSets.find(s => s.name === name);
  if (!rs) throw new Error(`Falta resultSet ${name}`);
  const idx = Object.fromEntries(rs.headers.map((h, i) => [h, i]));
  return { idx, rowSet: rs.rowSet };
}

function parseStat(data, { set, field }) {
  const { idx, rowSet } = rowsOf(data, set);
  if (idx.PLAYER_ID == null || idx.PLAYER_NAME == null || idx[field] == null) {
    throw new Error(`Cabeceras raras en ${set}: ${Object.keys(idx)}`);
  }
  return rowSet.map(row => ({
    name: String(row[idx.PLAYER_NAME]),
    value: Number(row[idx[field]]),
    nbaId: Number(row[idx.PLAYER_ID]),
  }));
}

const res = await fetch(URL, { headers: HEADERS });
if (!res.ok) {
  console.error(`NBA Stats ${res.status} ${res.statusText}`);
  process.exit(1);
}

const payload = await res.json();
const players = {};
for (const [id, spec] of Object.entries(STATS)) {
  const list = parseStat(payload, spec);
  if (list.length < 500) throw new Error(`${id}: solo ${list.length} filas`);
  if (list.some(p => !p.name || !Number.isFinite(p.value) || !p.nbaId)) {
    throw new Error(`${id}: fila inválida`);
  }
  players[id] = list;
  console.log(`${id.padEnd(4)} ${String(list.length).padStart(3)}  #1 ${list[0].name} (${list[0].value})`);
}

const out = {
  updatedAt: new Date().toISOString().slice(0, 10),
  source: "stats.nba.com/alltimeleadersgrids",
  players,
};

writeFileSync(TMP, `${JSON.stringify(out, null, 2)}\n`);
renameSync(TMP, OUT);
console.log(`\nOK ${OUT}${existsSync(OUT) ? "" : ""}  updatedAt=${out.updatedAt}`);
