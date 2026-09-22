"use server";

import { signIn, signOut } from "@/auth";

export async function signInGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signOutNow() {
  await signOut({ redirectTo: "/" });
}
