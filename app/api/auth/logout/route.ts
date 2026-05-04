import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getSession();
    await session.destroy();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
