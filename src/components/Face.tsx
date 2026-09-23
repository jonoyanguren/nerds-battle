"use client";

import { useEffect, useState } from "react";
import { initials, photoUrl } from "@/photos";
import type { Sport } from "@/types";

export type FacePlayer = { name: string; photoId: string };

export function Face({
  player,
  sport,
  size = "slot",
}: {
  player: FacePlayer;
  sport: Sport;
  size?: "slot" | "list";
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [player.photoId]);
  // Hay catálogos sin fotos (el fútbol no tiene CDN al que tirar). Se va
  // directo a las iniciales en vez de pedir una imagen vacía que fallaría
  // igual, pero después de una petición inútil por jugador.
  const src = sport.photoUrl && player.photoId ? photoUrl(sport.photoUrl, player.photoId) : "";
  if (broken || !src) {
    return <span className={`face face-fallback face-${size}`}>{initials(player.name)}</span>;
  }
  return (
    <img
      className={`face face-${size}`}
      src={src}
      alt=""
      onError={() => setBroken(true)}
    />
  );
}
