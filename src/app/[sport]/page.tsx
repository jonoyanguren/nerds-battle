import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { SPORTS, getSport } from "@/catalogs/registry";
import App from "../../App";

/** Una ruta por deporte: `/nba`, `/futbol`, `/f1`. Un id que no existe es
 *  un 404 de verdad, no una pantalla en blanco. */
export function generateStaticParams() {
  return SPORTS.map(s => ({ sport: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const meta = getSport(sport);
  return { title: meta ? `${meta.name} — Nerds Battle` : "Nerds Battle" };
}

export default async function Page({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (!getSport(sport)) notFound();

  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  return <App user={user} initialSportId={sport} />;
}
