"use client";

import { useState, useMemo, useRef, useEffect, type KeyboardEvent } from "react";
import { SPORTS, DEFAULT_SPORT_ID } from "./catalogs/registry";
import { SLOTS, fold, fmt, fmtDate } from "./format";
import { loadStats, saveStats } from "./storage";
import { AuthButton, type AuthUser } from "./components/AuthButton";
import { Face } from "./components/Face";
import { Profile } from "./components/Profile";
import type {
  CatalogPlayer,
  ChallengePayload,
  DuelSide,
  DuelWinner,
  LocalStats,
  Mode,
  Phase,
  ProfilePayload,
  RosterPick,
  RoundScore,
  Sport,
} from "./types";

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

const emptyRoster = (): (RosterPick | null)[] => Array(SLOTS).fill(null);

type SlotProps = {
  n: number;
  pick: RosterPick | null;
  sport: Sport;
  revealed: boolean;
  locked?: boolean;
  onRemove: () => void;
};

function Slot({ n, pick, sport, revealed, locked, onRemove }: SlotProps) {
  const cls = "slot" + (pick ? " filled" : "") + (revealed ? " revealed" : "");
  return (
    <div className={cls}>
      <div className="slot-no">{String(n + 1).padStart(2, "0")}</div>
      {pick ? <Face player={pick} sport={sport} size="slot" /> : <div className="face face-slot face-empty" />}
      {pick
        ? <div className="slot-name">{pick.name}</div>
        : <div className="slot-empty">vacío</div>}
      {revealed && pick && pick.value != null
        ? <SlotValue key={pick.name} value={pick.value} />
        : pick && !locked
          ? <button className="slot-x" onClick={onRemove}>QUITAR</button>
          : <div className="slot-drop">—</div>}
    </div>
  );
}

async function fetchChallenge(sportId: string, prevStatId: string | null): Promise<ChallengePayload> {
  const res = await fetch("/api/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sportId, prevStatId }),
  });
  if (!res.ok) throw new Error("challenge");
  return res.json() as Promise<ChallengePayload>;
}

type PickerProps = {
  sport: Sport;
  statId: string;
  picks: (RosterPick | null)[];
  onPick: (player: CatalogPlayer) => void;
  disabled: boolean;
};

function Picker({ sport, statId, picks, onPick, disabled }: PickerProps) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [hits, setHits] = useState<CatalogPlayer[]>([]);
  const [searching, setSearching] = useState(false);
  const taken = useMemo(
    () => new Set(picks.filter((p): p is RosterPick => p !== null).map(p => p.name)),
    [picks]
  );

  useEffect(() => {
    setQ("");
    setHits([]);
  }, [statId, sport.id]);

  useEffect(() => { setCursor(0); }, [q, hits]);

  useEffect(() => {
    const needle = fold(q.trim());
    if (!needle) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/players?sport=${encodeURIComponent(sport.id)}&stat=${encodeURIComponent(statId)}&q=${encodeURIComponent(q.trim())}`,
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error("players");
        const data = await res.json() as { players: CatalogPlayer[] };
        setHits(data.players.filter(p => !taken.has(p.name)));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [q, sport.id, statId, taken]);

  const choose = (p: CatalogPlayer) => { onPick(p); setQ(""); };

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
            ? <div className="no-hit">
                {searching ? "Buscando…" : `Ningún jugador del ranking coincide con «${q}».`}
              </div>
            : hits.map((p, i) => (
                <button key={p.name} className={i === cursor ? "cursor" : ""}
                        onMouseEnter={() => setCursor(i)} onClick={() => choose(p)}>
                  <span className="who">
                    <Face player={p} sport={sport} size="list" />
                    <span>{p.name}</span>
                  </span>
                  <span className="tag">#{p.rank} DEL RANKING</span>
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

type Tab = "play" | "profile";

async function fetchProfile(): Promise<ProfilePayload | null> {
  const res = await fetch("/api/me");
  if (!res.ok) return null;
  return res.json() as Promise<ProfilePayload>;
}

export default function App({ user }: { user: AuthUser | null }) {
  const [sportId, setSportId] = useState(DEFAULT_SPORT_ID);
  const [tab, setTab] = useState<Tab>("play");
  const [challenge, setChallenge] = useState<ChallengePayload | null>(null);
  const [picks, setPicks] = useState<(RosterPick | null)[]>(emptyRoster);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<Phase>("picking");
  const [stats, setStats] = useState<LocalStats>({ rounds: 0, best: 0, sum: 0 });
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(user));
  const [sting, setSting] = useState<Sting | null>(null);
  const [result, setResult] = useState<RoundScore | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [locking, setLocking] = useState(false);
  const timers = useRef<number[]>([]);

  // --- M6: dos jugadores, mismo móvil ---
  const [mode, setMode] = useState<Mode>("solo");
  const [turn, setTurn] = useState<1 | 2>(1);
  const [home, setHome] = useState<(RosterPick | null)[]>(emptyRoster);
  const [away, setAway] = useState<(RosterPick | null)[]>(emptyRoster);
  const [duel, setDuel] = useState<{ sides: [DuelSide, DuelSide]; winner: DuelWinner } | null>(null);
  const [duelSting, setDuelSting] = useState(false);

  const applyProfile = (data: ProfilePayload) => {
    setProfile(data);
    setStats({ rounds: data.rounds, best: data.best, sum: data.sum });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchChallenge(DEFAULT_SPORT_ID, null);
        if (!cancelled) setChallenge(data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setStats(loadStats());
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      try {
        const data = await fetchProfile();
        if (!cancelled && data) applyProfile(data);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filled = picks.filter(Boolean).length;
  const homeFilled = home.filter(Boolean).length;
  const awayFilled = away.filter(Boolean).length;
  const duelReady = homeFilled === SLOTS && awayFilled === SLOTS;
  const draftTaken = mode === "duel" ? [...home, ...away] : picks;
  const total = picks.reduce((a, p, i) => a + (p && i < shown && p.value != null ? p.value : 0), 0);
  const finalTotal = picks.reduce((a, p) => a + (p?.value ?? 0), 0);

  const fillSlot = (roster: (RosterPick | null)[], p: CatalogPlayer) => {
    const i = roster.findIndex(x => !x);
    if (i === -1) return roster;
    const next = [...roster];
    next[i] = p;
    return next;
  };

  const place = (p: CatalogPlayer) => {
    if (mode === "duel") {
      if (turn === 1) setHome(r => fillSlot(r, p));
      else setAway(r => fillSlot(r, p));
      setTurn(t => (t === 1 ? 2 : 1));
      return;
    }
    setPicks(r => fillSlot(r, p));
  };

  const remove = (i: number) => {
    const next = [...picks];
    next[i] = null;
    setPicks(next);
  };

  const revealDuel = async () => {
    if (!challenge) return;
    const firstPicks = home.filter((p): p is RosterPick => p !== null);
    const second = away.filter((p): p is RosterPick => p !== null);
    if (firstPicks.length !== SLOTS || second.length !== SLOTS) return;
    setLocking(true);
    try {
      // Una sola llamada con las dos plantillas: si el primero revelara por
      // su cuenta, sus cifras estarían en la misma pantalla que va a usar el
      // segundo. Y el ganador lo decide el motor, en el servidor.
      const res = await fetch("/api/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: challenge.sport.id,
          stat: challenge.stat.id,
          target: challenge.target,
          rosters: [firstPicks.map(p => p.name), second.map(p => p.name)],
        }),
      });
      if (!res.ok) throw new Error("duel");
      const data = await res.json() as {
        sides: ({ values: number[]; total: number } & RoundScore)[];
        winner: DuelWinner;
      };
      const withValues = (roster: RosterPick[], i: number) =>
        roster.map((p, j) => ({ ...p, value: data.sides[i].values[j] }));
      setDuel({
        sides: [
          { picks: withValues(firstPicks, 0), total: data.sides[0].total, score: data.sides[0] },
          { picks: withValues(second, 1), total: data.sides[1].total, score: data.sides[1] },
        ],
        winner: data.winner,
      });
      setPhase("done");
      setDuelSting(true);
      timers.current.push(window.setTimeout(() => setDuelSting(false), 2400));
    } catch {
      setLocking(false);
    }
  };

  const reveal = async () => {
    if (!challenge || locking || phase !== "picking") return;
    if (mode === "duel") return revealDuel();
    const names = picks.map(p => p?.name);
    if (names.some(n => !n)) return;

    setLocking(true);
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: challenge.sport.id,
          stat: challenge.stat.id,
          names,
          target: challenge.target,
        }),
      });
      if (!res.ok) throw new Error("reveal");
      const data = await res.json() as { values: number[] } & RoundScore;
      const next = picks.map((p, i) => (p ? { ...p, value: data.values[i] } : null));
      setPicks(next);
      setResult(data);
      setPhase("revealing");
      timers.current = next.map((_, i) =>
        window.setTimeout(() => {
          setShown(i + 1);
          if (i === SLOTS - 1) {
            setPhase("done");
            const grade = stingOf(data.err);
            setSting(grade);
            timers.current.push(window.setTimeout(() => setSting(null), 2200));
            if (user) {
              void fetchProfile().then(me => { if (me) applyProfile(me); });
            } else {
              setStats(s => {
                const ns = { rounds: s.rounds + 1, best: Math.max(s.best, data.points), sum: s.sum + data.points };
                saveStats(ns);
                return ns;
              });
            }
          }
        }, REVEAL_STEP_MS * (i + 1))
      );
    } catch {
      setLocking(false);
    }
  };

  /** Deja la mesa como al empezar, en cualquiera de los dos modos. */
  const resetRound = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPicks(emptyRoster());
    setHome(emptyRoster());
    setAway(emptyRoster());
    setShown(0);
    setPhase("picking");
    setSting(null);
    setResult(null);
    setLocking(false);
    setTurn(1);
    setDuel(null);
    setDuelSting(false);
  };

  const selectMode = (next: Mode) => {
    if (next === mode || locking || phase === "revealing") return;
    resetRound();
    setMode(next);
  };

  const nextRound = async () => {
    if (!challenge) return;
    resetRound();
    try {
      const data = await fetchChallenge(challenge.sport.id, challenge.stat.id);
      setChallenge(data);
    } catch {
      setLoadError(true);
    }
  };

  const selectSport = async (id: string) => {
    if (id === sportId || locking || phase === "revealing") return;
    resetRound();
    setSportId(id);
    setChallenge(null);
    try {
      const data = await fetchChallenge(id, null);
      setChallenge(data);
    } catch {
      setLoadError(true);
    }
  };

  const retryBoot = async () => {
    setLoadError(false);
    try {
      const data = await fetchChallenge(sportId, null);
      setChallenge(data);
    } catch {
      setLoadError(true);
    }
  };

  const liveSum = useCountUp(total, COUNT_SUM_MS);
  const boardOn = phase === "done" && sting === null;
  const boardSum = useCountUp(boardOn ? finalTotal : 0, COUNT_SUM_MS);
  const boardDiff = useCountUp(boardOn ? (result?.diff ?? 0) : 0, COUNT_SUM_MS);
  const boardPts = useCountUp(boardOn ? (result?.points ?? 0) : 0, COUNT_SCORE_MS);

  const avg = stats.rounds ? Math.round(stats.sum / stats.rounds) : 0;
  const soloPhase = phase === "picking" ? "Fichajes" : phase === "revealing" ? "Revelando" : "Final";
  const phaseLabel = mode === "duel"
    ? (duel ? "Duelo · resultado" : `Jugador ${turn} ficha`)
    : soloPhase;
  const duelWord = duel
    ? (duel.winner === null ? "Empate" : `Gana J${duel.winner}`)
    : "";

  const grade = result && phase === "done" ? stingOf(result.err) : null;

  return (
    <div className={grade ? `arena arena-${grade}` : "arena"}>
      {sting && (
        <button type="button" className={`sting sting-${sting}`} onClick={() => setSting(null)}>
          <span className="sting-word">{STING_LABEL[sting]}</span>
          {result && <span className="sting-sub">{result.verdict.title}</span>}
        </button>
      )}

      {duelSting && duel && (
        <button
          type="button"
          className={`sting sting-${duel.winner === null ? "close" : "hit"}`}
          onClick={() => setDuelSting(false)}
        >
          <span className="sting-word">{duelWord}</span>
          <span className="sting-sub">
            {duel.winner === null
              ? "Mismo error los dos"
              : `Error ${(duel.sides[duel.winner - 1].score.err * 100).toFixed(1)}%`}
          </span>
        </button>
      )}

      <header className="hud">
        <div>
          <h1 className="wordmark">NERDS <em>BATTLE</em></h1>
          <nav className="tabs" aria-label="Sección">
            <button type="button" className={"tab" + (tab === "play" ? " on" : "")} onClick={() => setTab("play")}>
              Juego
            </button>
            <button type="button" className={"tab" + (tab === "profile" ? " on" : "")} onClick={() => setTab("profile")}>
              Perfil
            </button>
          </nav>
          {tab === "play" && (
            <>
              <nav className="sports" aria-label="Catálogo">
                {SPORTS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={"sport-tab" + (s.id === (challenge?.sport.id ?? sportId) ? " on" : "")}
                    aria-pressed={s.id === (challenge?.sport.id ?? sportId)}
                    disabled={SPORTS.length === 1 || locking || phase === "revealing"}
                    onClick={() => selectSport(s.id)}
                  >
                    <img src={s.logo} alt="" width={20} height={20} />
                    <span>{s.name}</span>
                  </button>
                ))}
              </nav>
              <nav className="modes" aria-label="Modo de juego">
                <button
                  type="button"
                  className={"mode-tab" + (mode === "solo" ? " on" : "")}
                  aria-pressed={mode === "solo"}
                  disabled={locking || phase === "revealing"}
                  onClick={() => selectMode("solo")}
                >
                  1 jugador
                </button>
                <button
                  type="button"
                  className={"mode-tab" + (mode === "duel" ? " on" : "")}
                  aria-pressed={mode === "duel"}
                  disabled={locking || phase === "revealing"}
                  onClick={() => selectMode("duel")}
                >
                  2 jugadores
                </button>
              </nav>
              {challenge && (
                <div className="hud-meta">{challenge.sport.scope} · {fmtDate(challenge.updatedAt)}</div>
              )}
            </>
          )}
        </div>
        <div className="hud-right">
          <div className="hud-stats">
            <div className="hud-stat">Récord<b>{stats.best}</b></div>
            <div className="hud-stat">Media<b>{avg}</b></div>
            <div className="hud-stat">Rondas<b>{stats.rounds}</b></div>
          </div>
          <AuthButton user={user} />
        </div>
      </header>

      {tab === "profile" && (
        <Profile user={user} profile={profile} loading={profileLoading} />
      )}

      {tab === "play" && loadError && (
        <>
          <p className="credit">No se pudo cargar el reto.</p>
          <button className="btn primary" onClick={retryBoot}>Reintentar</button>
        </>
      )}

      {tab === "play" && !loadError && !challenge && (
        <div aria-busy="true" />
      )}

      {tab === "play" && challenge && (
      <>
      <section className="jumbo">
        <div>
          <div className="phase">{phaseLabel} · 5 vs objetivo</div>
          <h2 className="stat-name">{challenge.stat.label}</h2>
          <p className="stat-note">
            {mode === "duel"
              ? "Uno a uno. Un jugador no se puede repetir. Las cifras salen al final."
              : "Elige cinco. Las cifras salen al final."}
          </p>
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

      {!duel && mode === "solo" && (
        <>
          <div className="roster-label">
            <span>Plantilla</span>
            <span>{filled}/{SLOTS}</span>
          </div>
          <div className="slots">
            {picks.map((p, i) => (
              <Slot key={i} n={i} pick={p} sport={challenge.sport} revealed={i < shown} onRemove={() => remove(i)} />
            ))}
          </div>
        </>
      )}

      {!duel && mode === "duel" && (
        <div className="draft-boards">
          {([home, away] as const).map((roster, side) => (
            <div key={side} className={"roster-block" + (turn === side + 1 && !duelReady ? " on" : "")}>
              <div className="roster-label">
                <span>Jugador {side + 1}{turn === side + 1 && !duelReady ? " · le toca" : ""}</span>
                <span>{roster.filter(Boolean).length}/{SLOTS}</span>
              </div>
              <div className="slots">
                {roster.map((p, i) => (
                  <Slot
                    key={`${side}-${i}`}
                    n={i}
                    pick={p}
                    sport={challenge.sport}
                    revealed={false}
                    locked
                    onRemove={() => {}}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {duel && (
        <section className="duel">
          <div className="duel-head">
            <span>Objetivo {fmt(challenge.target)}</span>
            <b>{duelWord}</b>
          </div>
          <div className="duel-grid">
            {duel.sides.map((side, i) => (
              <div
                key={i}
                className={
                  "duel-side" +
                  (duel.winner === i + 1 ? " win" : "") +
                  (duel.winner !== null && duel.winner !== i + 1 ? " lose" : "")
                }
              >
                <div className="duel-who">
                  <span>Jugador {i + 1}</span>
                  {duel.winner === i + 1 && <em>gana</em>}
                  {duel.winner === null && <em>empate</em>}
                </div>
                <div className="duel-nums">
                  <div><span>Suma</span><b>{fmt(side.total)}</b></div>
                  <div>
                    <span>Diff</span>
                    <b style={{ color: side.score.diff === 0 ? "var(--good)" : side.score.diff > 0 ? "var(--accent)" : "var(--bad)" }}>
                      {side.score.diff > 0 ? "+" : ""}{fmt(side.score.diff)}
                    </b>
                  </div>
                  <div><span>Error</span><b>{(side.score.err * 100).toFixed(1)}%</b></div>
                </div>
                <ul className="duel-picks">
                  {side.picks.map(p => (
                    <li key={p.name} className="duel-pick">
                      <Face player={p} sport={challenge.sport} size="list" />
                      <span className="duel-pick-name">{p.name}</span>
                      <span className="duel-pick-value">{fmt(p.value ?? 0)}</span>
                    </li>
                  ))}
                </ul>
                <div className="duel-verdict">{side.score.verdict.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="draft">
        {!duel && (
          <Picker
            key={`${challenge.stat.id}-${mode}-${turn}`}
            sport={challenge.sport}
            statId={challenge.stat.id}
            picks={draftTaken}
            onPick={place}
            disabled={phase !== "picking" || (mode === "duel" && duelReady)}
          />
        )}
        {phase === "done"
          ? <button className="btn primary" onClick={nextRound}>Siguiente</button>
          : <button
              className="btn primary"
              onClick={reveal}
              disabled={(mode === "duel" ? !duelReady : filled < SLOTS) || phase !== "picking" || locking}
            >
              Fijar
            </button>}
      </div>
      {phase === "picking" && (mode === "duel" ? duelReady : filled === SLOTS) && (
        <span className="hint">Plantillas listas. Fija.</span>
      )}

      {result && phase === "done" && (
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
        {challenge.poolSize.toLocaleString("es-ES")} jugadores · act. {fmtDate(challenge.updatedAt)}
      </p>
      </>
      )}
    </div>
  );
}
