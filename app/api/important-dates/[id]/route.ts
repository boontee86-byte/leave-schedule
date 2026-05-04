import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { team_id } = await requireTeam();
    const { id } = await ctx.params;
    const db = supabaseAdmin();
    const { error } = await db
      .from("important_dates")
      .delete()
      .eq("id", id)
      .eq("team_id", team_id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
