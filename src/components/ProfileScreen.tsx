"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSport } from "@/catalogs/registry";
import type { ProfilePayload } from "@/types";
import { AuthButton, type AuthUser } from "./AuthButton";
import { Profile } from "./Profile";
import { SectionNav } from "./SectionNav";

export function ProfileScreen({ user }: { user: AuthUser | null }) {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [playHref, setPlayHref] = useState("/");

  useEffect(() => {
    try {
      const id = sessionStorage.getItem("nb-sport");
      if (id && getSport(id)) setPlayHref(`/${id}`);
    } catch { /* sessionStorage puede fallar en modo privado */ }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = await res.json() as ProfilePayload;
        if (!cancelled) setProfile(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="arena">
      <header className="hud">
        <div>
          <h1 className="wordmark"><Link href="/">NERDS <em>BATTLE</em></Link></h1>
          <SectionNav playHref={playHref} />
        </div>
        <div className="hud-right">
          <AuthButton user={user} redirectTo="/perfil" />
        </div>
      </header>
      <Profile user={user} profile={profile} loading={loading} />
    </div>
  );
}
