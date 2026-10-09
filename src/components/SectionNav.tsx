"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Juego y Perfil son pantallas, no pestañas de la partida. */
export function SectionNav({ playHref = "/" }: { playHref?: string }) {
  const onProfile = usePathname() === "/perfil";
  return (
    <nav className="tabs" aria-label="Sección">
      <Link
        href={playHref}
        className={"tab" + (onProfile ? "" : " on")}
        aria-current={onProfile ? undefined : "page"}
      >
        Juego
      </Link>
      <Link
        href="/perfil"
        className={"tab" + (onProfile ? " on" : "")}
        aria-current={onProfile ? "page" : undefined}
      >
        Perfil
      </Link>
    </nav>
  );
}
