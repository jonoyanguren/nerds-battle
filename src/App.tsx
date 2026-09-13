import { useState, useMemo, useRef, useEffect, type KeyboardEvent } from "react";
import { DATA_UPDATED_AT, PLAYERS, headshotUrl, initials } from "./data";
import {
  SLOTS,
  fold,
  fmt,
  fmtDate,
  makeChallenge,
  scoreRound,
  loadStats,
  saveStats,
} from "./engine";
import type { LocalStats, Phase, Player, StatId } from "./types";

type SlotProps = {
  n: number;
  pick: Player | null;
  revealed: boolean;
  onRemove: () => void;
};

function Face({ player, size = "slot" }: { player: Player; size?: "slot" | "list" }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [player.nbaId]);
  if (broken) {
    return <span className={`face face-fallback face-${size}`}>{initials(player.name)}</span>;
  }
  return (
    <img
      className={`face face-${size}`}
      src={headshotUrl(player.nbaId)}
      alt=""
      onError={() => setBroken(true)}
    />
  );
}

function Slot({ n, pick, revealed, onRemove }: SlotProps) {
  const cls = "slot" + (pick ? " filled" : "") + (revealed ? " revealed" : "");
  return (
    <div className={cls}>
      <div className="slot-no">{String(n + 1).padStart(2, "0")}</div>
      {pick ? <Face player={pick} size="slot" /> : <div className="face face-slot face-empty" />}
      {pick
        ? <div className="slot-name">{pick.name}</div>
        : <div className="slot-empty">vacío</div>}
      {revealed && pick
        ? <div className="slot-value">{fmt(pick.value)}</div>
        : pick
          ? <button className="slot-x" onClick={onRemove}>QUITAR</button>
          : <div className="slot-drop">—</div>}
    </div>
  );
}

type PickerProps = {
  statId: StatId;
  picks: (Player | null)[];
  onPick: (player: Player) => void;
  disabled: boolean;
};

function Picker({ statId, picks, onPick, disabled }: PickerProps) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const taken = useMemo(
    () => new Set(picks.filter((p): p is Player => p !== null).map(p => p.name)),
    [picks]
  );

  const hits = useMemo(() => {
    const needle = fold(q.trim());
    if (!needle) return [];
    return PLAYERS[statId]
      .filter(p => !taken.has(p.name) && fold(p.name).includes(needle))
      .slice(0, 40);
  }, [q, statId, taken]);

  useEffect(() => { setCursor(0); }, [q]);
  useEffect(() => { setQ(""); }, [statId]);

  const choose = (p: Player) => { onPick(p); setQ(""); };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, hits.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); choose(hits[cursor]); }
    if (e.key === "Escape")    { setQ(""); }
  };

  return (
    <div className="picker">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={onKey}
        disabled={disabled}
        placeholder={disabled ? "Ronda cerrada" : "Busca un jugador y colócalo en un hueco…"}
        aria-label="Buscar jugador"
      />
      {q.trim() && !disabled && (
        <div className="results">
          {hits.length === 0
            ? <div className="no-hit">Ningún jugador del ranking coincide con «{q}».</div>
            : hits.map((p, i) => (
                <button key={p.name} className={i === cursor ? "cursor" : ""}
                        onMouseEnter={() => setCursor(i)} onClick={() => choose(p)}>
                  <span className="who">
                    <Face player={p} size="list" />
                    <span>{p.name}</span>
                  </span>
                  <span className="tag">#{PLAYERS[statId].indexOf(p) + 1} DEL RANKING</span>
                </button>
              ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [challenge, setChallenge] = useState(() => makeChallenge(null));
  const [picks, setPicks] = useState<(Player | null)[]>(() => Array(SLOTS).fill(null));
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<Phase>("picking");
  const [stats, setStats] = useState<LocalStats>(loadStats);
  const timers = useRef<number[]>([]);

  const filled = picks.filter(Boolean).length;
  const total = picks.reduce((a, p, i) => a + (p && i < shown ? p.value : 0), 0);
  const finalTotal = picks.reduce((a, p) => a + (p ? p.value : 0), 0);
  const result = phase === "done" ? scoreRound(finalTotal, challenge.target) : null;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const place = (p: Player) => {
    const i = picks.findIndex(x => !x);
    if (i === -1) return;
    const next = [...picks];
    next[i] = p;
    setPicks(next);
  };

  const remove = (i: number) => {
    const next = [...picks];
    next[i] = null;
    setPicks(next);
  };

  const reveal = () => {
    setPhase("revealing");
    timers.current = picks.map((_, i) =>
      window.setTimeout(() => {
        setShown(i + 1);
        if (i === SLOTS - 1) {
          setPhase("done");
          const r = scoreRound(finalTotal, challenge.target);
          setStats(s => {
            const next = { rounds: s.rounds + 1, best: Math.max(s.best, r.points), sum: s.sum + r.points };
            saveStats(next);
            return next;
          });
        }
      }, 380 * (i + 1))
    );
  };

  const nextRound = () => {
    timers.current.forEach(clearTimeout);
    setChallenge(makeChallenge(challenge.stat.id));
    setPicks(Array(SLOTS).fill(null));
    setShown(0);
    setPhase("picking");
  };

  const avg = stats.rounds ? Math.round(stats.sum / stats.rounds) : 0;

  return (
    <>
      <header className="masthead">
        <div>
          <div className="league">Sports · NBA · Carrera · act. {fmtDate(DATA_UPDATED_AT)}</div>
          <h1 className="wordmark">NERDS <em>BATTLE</em></h1>
        </div>
        <div className="scoreboard-mini">
          <div>Récord<b>{stats.best}</b></div>
          <div>Media<b>{avg}</b></div>
          <div>Rondas<b>{stats.rounds}</b></div>
        </div>
      </header>

      <section className="challenge">
        <div>
          <div className="eyebrow">Reto · 5 jugadores</div>
          <h2 className="stat-name">{challenge.stat.label} en carrera</h2>
          <p className="stat-note">{challenge.stat.note} Suma cinco jugadores y acércate al objetivo. No verás sus cifras hasta el final.</p>
        </div>
        <div className="target">
          <span>Objetivo</span>
          <b>{fmt(challenge.target)}</b>
        </div>
      </section>

      <div className="slots">
        {picks.map((p, i) => (
          <Slot key={i} n={i} pick={p} revealed={i < shown} onRemove={() => remove(i)} />
        ))}
      </div>

      <Picker statId={challenge.stat.id} picks={picks} onPick={place} disabled={phase !== "picking"} />

      <div className="actions">
        {phase === "done"
          ? <button className="btn primary" onClick={nextRound}>Nuevo reto</button>
          : <button className="btn primary" onClick={reveal} disabled={filled < SLOTS || phase !== "picking"}>
              Revelar cifras
            </button>}
        {phase === "picking" && (
          <span className="hint">
            {filled < SLOTS
              ? `${SLOTS - filled} ${SLOTS - filled === 1 ? "hueco" : "huecos"} por rellenar`
              : "Cinco elegidos. Cuando quieras."}
          </span>
        )}
        {phase === "revealing" && <span className="hint">Sumando… {fmt(total)}</span>}
      </div>

      {result && (
        <section className="result">
          <div className="result-top">
            <div className="result-cell">
              <span>Tu suma</span>
              <b>{fmt(finalTotal)}</b>
            </div>
            <div className="result-cell">
              <span>Diferencia</span>
              <b style={{ color: result.diff === 0 ? "var(--good)" : result.diff > 0 ? "var(--accent)" : "var(--bad)" }}>
                {result.diff > 0 ? "+" : ""}{fmt(result.diff)}
              </b>
            </div>
            <div className="result-cell">
              <span>Puntos</span>
              <b style={{ color: "var(--good)" }}>{result.points}</b>
            </div>
          </div>
          <div className="bar"><i style={{ width: `${result.points / 10}%` }}></i></div>
          <div className="verdict">
            <div className="verdict-title">{result.verdict.title}</div>
            <div className="verdict-line">
              {result.verdict.line} Error del {(result.err * 100).toFixed(1)}%.
            </div>
          </div>
        </section>
      )}

      <footer>
        Última actualización: {fmtDate(DATA_UPDATED_AT)} · carrera NBA, temporada regular, {PLAYERS[challenge.stat.id].length.toLocaleString("es-ES")} jugadores en este ranking (NBA Stats).<br />
        El objetivo de cada reto se genera sumando cinco jugadores reales del ranking, así que siempre hay una combinación que lo clava.<br />
        Prototipo v0.1 · un jugador. Fotos del CDN de la NBA. <code>npm run sync</code> pisa los datos.
      </footer>
    </>
  );
}
