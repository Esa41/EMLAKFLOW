import { NextResponse } from "next/server";
import { clearSiteSession } from "@/lib/site-auth";

/** Vitrin üyeliği — çıkış. */
export async function POST() {
  await clearSiteSession();
  return NextResponse.json({ ok: true });
}
