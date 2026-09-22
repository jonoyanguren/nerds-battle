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
  if (broken) {
    return <span className={`face face-fallback face-${size}`}>{initials(player.name)}</span>;
  }
  return (
    <img
      className={`face face-${size}`}
      src={photoUrl(sport.photoUrl, player.photoId)}
      alt=""
      onError={() => setBroken(true)}
    />
  );
}
