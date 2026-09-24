"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { initials, photoUrl, fallbackTone } from "@/photos";
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
  const src = sport.photoUrl && player.photoId ? photoUrl(sport.photoUrl, player.photoId) : "";
  if (broken || !src) {
    return (
      <span
        className={`face face-fallback face-${size} face-${sport.id}`}
        style={{ "--face-tone": fallbackTone(player.name) } as CSSProperties}
      >
        {initials(player.name)}
      </span>
    );
  }
  return (
    <img
      className={`face face-${size} face-${sport.id}`}
      src={src}
      alt=""
      onError={() => setBroken(true)}
    />
  );
}
