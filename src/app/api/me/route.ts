import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProfile } from "@/lib/rounds";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  return NextResponse.json(await getProfile(session.user.id));
}
