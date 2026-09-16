import { NextResponse } from "next/server";
import { SPORTS } from "@/catalogs/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ sports: SPORTS });
}
