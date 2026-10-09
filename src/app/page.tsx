import Link from "next/link";
import { auth } from "@/auth";
import { sportGroups } from "@/catalogs/registry";
import { AuthButton } from "@/components/AuthButton";
import { SectionNav } from "@/components/SectionNav";

/**
 * Landing. Hasta ahora el juego era una sola pantalla y el deporte se
 * elegía con una pestaña dentro de la partida; quien llegaba de cero no
 * sabía ni de qué iba esto.
 *
 * El texto no se inventa: sale de `CLAUDE.md` y de la descripción que ya
 * estaba en `layout.tsx`. Si algún día cambia la idea del juego, cambia
 * ahí primero y aquí después.
 */
export const metadata = {
  title: "Nerds Battle — estima totales de carrera",
};

export default async function Landing() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  return (
    <div className="landing">
      <header className="landing-top">
        <div>
          <h1 className="wordmark">NERDS <em>BATTLE</em></h1>
          <SectionNav playHref="/" />
        </div>
        <AuthButton user={user} />
      </header>

      <section className="landing-hero">
        <p className="landing-claim">
          Lo difícil no es saberse los nombres.<br />
          <em>Es saberse los números.</em>
        </p>
        <p className="landing-sub">
          Estima totales de carrera. Cinco jugadores, un objetivo, y no ves
          ninguna cifra hasta el final.
        </p>
      </section>

      <ol className="landing-how">
        <li>
          <span className="landing-step">01</span>
          Te damos una estadística y un número que alcanzar.
        </li>
        <li>
          <span className="landing-step">02</span>
          Fichas cinco jugadores. A ciegas: sus cifras no se ven.
        </li>
        <li>
          <span className="landing-step">03</span>
          Al revelar se suman, y ves cuánto te has acercado.
        </li>
      </ol>

      <div className="landing-pick">
        <div className="roster-label"><span>Elige deporte</span></div>
        {sportGroups().map(group => (
          <section key={group.category} className="landing-family">
            <h2>{group.label}</h2>
            <div className="landing-cards">
              {group.sports.map(sport => (
                <Link key={sport.id} href={`/${sport.id}`} className="landing-card">
                  <img src={sport.logo} alt="" width={34} height={34} />
                  <b>{sport.name}</b>
                  <span>{sport.scope}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="credit">
        Se puede jugar sin cuenta. Con Google se guardan tus rondas y tu récord.
      </p>
    </div>
  );
}
