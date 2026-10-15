import { createHmac, timingSafeEqual } from "node:crypto";

export type SignedChallenge = {
  sport: string;
  stat: string;
  target: number;
};

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET");
  return value;
}

function signBody(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/** Recibo del reto. Sin tabla: Vercel no guarda el challenge entre peticiones. */
export function signChallenge(payload: SignedChallenge): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `v1.${body}.${signBody(body)}`;
}

export function openChallenge(token: unknown): SignedChallenge | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const body = parts[1];
  const sig = parts[2];
  let expected: string;
  try {
    expected = signBody(body);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const { sport, stat, target } = parsed as Record<string, unknown>;
    if (
      typeof sport !== "string" ||
      typeof stat !== "string" ||
      typeof target !== "number" ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      return null;
    }
    return { sport, stat, target };
  } catch {
    return null;
  }
}

/** El token tiene que ser de este deporte y esta estadística, no un reto de otra. */
export function openChallengeFor(
  token: unknown,
  sport: string,
  stat: string,
): SignedChallenge | null {
  const opened = openChallenge(token);
  if (!opened || opened.sport !== sport || opened.stat !== stat) return null;
  return opened;
}
