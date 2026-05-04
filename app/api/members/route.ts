import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { memberCreateSchema } from "@/lib/schema";
import { handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { team_id } = await requireTeam();
    const body = await req.json();
    const { name } = memberCreateSchema.parse(body);
    const db = supabaseAdmin();

    const { count } = await db
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team_id)
      .is("deleted_at", null);

    const { data, error } = await db
      .from("members")
      .insert({ team_id, name, sort_order: count ?? 0 })
      .select("id, name, sort_order")
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, member: data });
  } catch (err) {
    return handleError(err);
  }
}
