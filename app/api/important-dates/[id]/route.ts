import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { importantUpdateSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { team_id } = await requireTeam();
    const { id } = await ctx.params;
    const body = await req.json();
    const patch = importantUpdateSchema.parse(body);
    if (Object.keys(patch).length === 0) return jsonError("Nothing to update");

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("important_dates")
      .update(patch)
      .eq("id", id)
      .eq("team_id", team_id)
      .select("id, date, label, color_key, notes")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, date: data });
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
