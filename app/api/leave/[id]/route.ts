import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { leaveUpdateSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { team_id } = await requireTeam();
    const { id } = await ctx.params;
    const body = await req.json();
    const patch = leaveUpdateSchema.parse(body);
    if (Object.keys(patch).length === 0) return jsonError("Nothing to update");

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("leave_entries")
      .update(patch)
      .eq("id", id)
      .eq("team_id", team_id)
      .select("id, member_id, date, leave_type, notes")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, entry: data });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { team_id } = await requireTeam();
    const { id } = await ctx.params;
    const db = supabaseAdmin();
    const { error } = await db
      .from("leave_entries")
      .delete()
      .eq("id", id)
      .eq("team_id", team_id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
