"use server";

import { signIn, signOut } from "@/auth";
import { getSport } from "@/catalogs/registry";

function safeRedirect(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (raw === "/" || raw === "/perfil") return raw;
  const id = raw.startsWith("/") ? raw.slice(1) : "";
  if (id && !id.includes("/") && getSport(id)) return raw;
  return "/";
}

export async function signInGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeRedirect(formData.get("redirectTo")) });
}

export async function signOutNow() {
  await signOut({ redirectTo: "/" });
}
