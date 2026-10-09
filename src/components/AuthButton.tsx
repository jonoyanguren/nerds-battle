"use client";

import { signInGoogle, signOutNow } from "@/app/actions/auth";

export type AuthUser = {
  name: string | null;
  image: string | null;
};

export function AuthButton({
  user,
  redirectTo = "/",
}: {
  user: AuthUser | null;
  redirectTo?: string;
}) {
  if (user) {
    return (
      <form action={signOutNow} className="auth">
        {user.image ? <img src={user.image} alt="" width={28} height={28} /> : null}
        {user.name ? <span>{user.name}</span> : null}
        <button type="submit" className="btn auth-btn">Salir</button>
      </form>
    );
  }
  return (
    <form action={signInGoogle} className="auth">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" className="btn auth-btn">Entrar con Google</button>
    </form>
  );
}
