"use client";

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
import type { Challenge, LocalStats, Phase, Player, StatId } from "./types";

const REVEAL_STEP_MS = 720;
const COUNT_SLOT_MS = 1400;
const COUNT_SUM_MS = 900;
const COUNT_SCORE_MS = 2000;

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

function useCountUp(target: number, duration: number) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = displayRef.current;
    if (reduced || duration === 0 || target === from) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    if (target === 0) {
      displayRef.current = 0;
      setDisplay(0);
      return;
    }

    const delta = target - from;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const next = from + delta * easeOutQuart(t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        displayRef.current = target;
        setDisplay(target);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return Math.round(display);
}

function SlotValue({ value }: { value: number }) {
  const n = useCountUp(value, COUNT_SLOT_MS);
  return <div className="slot-value">{fmt(n)}</div>;
}

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
        ? <SlotValue key={pick.name} value={pick.value} />
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
        placeholder={disabled ? "Ronda cerrada" : "Fichar jugador…"}
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

type Sting = "hit" | "close" | "miss";

function stingOf(err: number): Sting {
  if (err <= 0.03) return "hit";
  if (err <= 0.15) return "close";
  return "miss";
}

const STING_LABEL: Record<Sting, string> = {
  hit: "Clavada",
  close: "Cerca",
  miss: "Fuera",
};

export default function App() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [picks, setPicks] = useState<(Player | null)[]>(() => Array(SLOTS).fill(null));
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<Phase>("picking");
  const [stats, setStats] = useState<LocalStats>({ rounds: 0, best: 0, sum: 0 });
  const [sting, setSting] = useState<Sting | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setStats(loadStats());
    setChallenge(makeChallenge(null));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const filled = picks.filter(Boolean).length;
  const total = picks.reduce((a, p, i) => a + (p && i < shown ? p.value : 0), 0);
  const finalTotal = picks.reduce((a, p) => a + (p ? p.value : 0), 0);
  const result = challenge && phase === "done" ? scoreRound(finalTotal, challenge.target) : null;

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
          const r = scoreRound(finalTotal, challenge!.target);
          const grade = stingOf(r.err);
          setSting(grade);
          timers.current.push(window.setTimeout(() => setSting(null), 2200));
          setStats(s => {
            const next = { rounds: s.rounds + 1, best: Math.max(s.best, r.points), sum: s.sum + r.points };
            saveStats(next);
            return next;
          });
        }
      }, REVEAL_STEP_MS * (i + 1))
    );
  };

  const nextRound = () => {
    timers.current.forEach(clearTimeout);
    setChallenge(makeChallenge(challenge!.stat.id));
    setPicks(Array(SLOTS).fill(null));
    setShown(0);
    setPhase("picking");
    setSting(null);
  };

  const liveSum = useCountUp(total, COUNT_SUM_MS);
  const boardOn = phase === "done" && sting === null;
  const boardSum = useCountUp(boardOn ? finalTotal : 0, COUNT_SUM_MS);
  const boardDiff = useCountUp(boardOn ? (result?.diff ?? 0) : 0, COUNT_SUM_MS);
  const boardPts = useCountUp(boardOn ? (result?.points ?? 0) : 0, COUNT_SCORE_MS);

  const avg = stats.rounds ? Math.round(stats.sum / stats.rounds) : 0;
  const phaseLabel = phase === "picking" ? "Fichajes" : phase === "revealing" ? "Revelando" : "Final";

  const grade = result ? stingOf(result.err) : null;

  if (!challenge) return <div className="arena" aria-busy="true" />;

  return (
    <div className={grade ? `arena arena-${grade}` : "arena"}>
      {sting && (
        <button type="button" className={`sting sting-${sting}`} onClick={() => setSting(null)}>
          <span className="sting-word">{STING_LABEL[sting]}</span>
          {result && <span className="sting-sub">{result.verdict.title}</span>}
        </button>
      )}

      <header className="hud">
        <div>
          <h1 className="wordmark">NERDS <em>BATTLE</em></h1>
          <div className="hud-meta">NBA · Carrera · {fmtDate(DATA_UPDATED_AT)}</div>
        </div>
        <div className="hud-stats">
          <div className="hud-stat">Récord<b>{stats.best}</b></div>
          <div className="hud-stat">Media<b>{avg}</b></div>
          <div className="hud-stat">Rondas<b>{stats.rounds}</b></div>
        </div>
      </header>

      <section className="jumbo">
        <div>
          <div className="phase">{phaseLabel} · 5 vs objetivo</div>
          <h2 className="stat-name">{challenge.stat.label}</h2>
          <p className="stat-note">Elige cinco. Las cifras salen al final.</p>
        </div>
        <div className="targets">
          {shown > 0 && (
            <div className="target target-sum">
              <span>Suma</span>
              <b>{fmt(liveSum)}</b>
            </div>
          )}
          <div className="target">
            <span>Objetivo</span>
            <b>{fmt(challenge.target)}</b>
          </div>
        </div>
      </section>

      <div className="roster-label">
        <span>Plantilla</span>
        <span>{filled}/{SLOTS}</span>
      </div>
      <div className="slots">
        {picks.map((p, i) => (
          <Slot key={i} n={i} pick={p} revealed={i < shown} onRemove={() => remove(i)} />
        ))}
      </div>

      <div className="draft">
        <Picker statId={challenge.stat.id} picks={picks} onPick={place} disabled={phase !== "picking"} />
        {phase === "done"
          ? <button className="btn primary" onClick={nextRound}>Siguiente</button>
          : <button className="btn primary" onClick={reveal} disabled={filled < SLOTS || phase !== "picking"}>
              Fijar
            </button>}
      </div>
      {phase === "picking" && filled === SLOTS && <span className="hint">Plantilla lista. Fija.</span>}

      {result && (
        <section className={`result result-${grade}`}>
          <div className="result-top">
            <div className="result-cell">
              <span>Suma</span>
              <b>{fmt(boardSum)}</b>
            </div>
            <div className="result-cell">
              <span>Diff</span>
              <b style={{ color: result.diff === 0 ? "var(--good)" : result.diff > 0 ? "var(--accent)" : "var(--bad)" }}>
                {boardDiff > 0 ? "+" : ""}{fmt(boardDiff)}
              </b>
            </div>
            <div className="result-cell">
              <span>Score</span>
              <b style={{ color: "var(--good)" }}>{boardPts}</b>
            </div>
          </div>
          <div className="bar"><i style={{ width: boardOn ? `${result.points / 10}%` : "0%" }}></i></div>
          <div className="verdict">
            <div className="verdict-title">{result.verdict.title}</div>
            <div className="verdict-line">
              {result.verdict.line} Error { (result.err * 100).toFixed(1)}%.
            </div>
          </div>
        </section>
      )}

      <p className="credit">
        {PLAYERS[challenge.stat.id].length.toLocaleString("es-ES")} jugadores · act. {fmtDate(DATA_UPDATED_AT)}
      </p>
    </div>
  );
}
