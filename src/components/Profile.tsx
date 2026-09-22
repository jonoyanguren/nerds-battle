"use client";

import { getSport } from "@/catalogs/registry";
import { fmt, fmtWhen } from "@/format";
import type { ProfilePayload } from "@/types";
import { AuthButton, type AuthUser } from "./AuthButton";
import { Face } from "./Face";

export function Profile({
  user,
  profile,
  loading,
}: {
  user: AuthUser | null;
  profile: ProfilePayload | null;
  loading: boolean;
}) {
  if (!user) {
    return (
      <section className="profile">
        <h2 className="stat-name">Perfil</h2>
        <p className="stat-note">
          Entra con Google para guardar récord, media e historial. Sin cuenta se
          puede jugar; las cifras se quedan en este navegador.
        </p>
        <AuthButton user={null} />
      </section>
    );
  }

  if (loading && !profile) {
    return <section className="profile" aria-busy="true" />;
  }

  const empty = !profile || profile.rounds === 0;

  return (
    <section className="profile">
      <div className="profile-head">
        {user.image ? <img src={user.image} alt="" width={56} height={56} /> : null}
        <div>
          <h2 className="profile-name">{user.name ?? "Nerd"}</h2>
          <p className="stat-note">
            {empty
              ? "Al fijar una plantilla se guarda aquí."
              : `${profile.rounds} ${profile.rounds === 1 ? "ronda" : "rondas"} guardadas.`}
          </p>
        </div>
      </div>

      {profile && profile.bestByStat.length > 0 && (
        <div>
          <div className="roster-label"><span>Mejor por estadística</span></div>
          <div className="profile-bests">
            {profile.bestByStat.map(item => (
              <div key={`${item.sport}:${item.stat}`} className="hud-stat">
                {item.label}<b>{item.points}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="roster-label">
          <span>Historial</span>
          {profile ? <span>{Math.min(profile.recent.length, profile.rounds)}</span> : null}
        </div>
        {empty ? (
          <p className="profile-empty">Aún no hay rondas con esta cuenta.</p>
        ) : (
          <div className="history">
            {profile.recent.map(round => {
              const sport = getSport(round.sport);
              return (
                <article key={round.id} className="history-round">
                  <div className="history-top">
                    <div>
                      <div className="history-stat">{round.sportName} · {round.statLabel}</div>
                      <div className="history-when">{fmtWhen(round.createdAt)}</div>
                    </div>
                    <div className="history-score">
                      <b>{round.points}</b>
                      <span>{round.verdict}</span>
                    </div>
                  </div>
                  <div className="history-board">
                    <div className="result-cell">
                      <span>Objetivo</span>
                      <b>{fmt(round.target)}</b>
                    </div>
                    <div className="result-cell">
                      <span>Suma</span>
                      <b>{fmt(round.total)}</b>
                    </div>
                    <div className="result-cell">
                      <span>Error</span>
                      <b style={{ color: round.err <= 0.03 ? "var(--good)" : round.err <= 0.15 ? "var(--accent)" : "var(--bad)" }}>
                        {(round.err * 100).toFixed(1)}%
                      </b>
                    </div>
                  </div>
                  {sport && (
                    <div className="history-picks">
                      {round.names.map((name, i) => (
                        <div key={`${round.id}-${name}`} className="history-pick">
                          <Face
                            player={{ name, photoId: round.photoIds[i] ?? "" }}
                            sport={sport}
                            size="list"
                          />
                          <span>{name}</span>
                          <b>{fmt(round.values[i] ?? 0)}</b>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
