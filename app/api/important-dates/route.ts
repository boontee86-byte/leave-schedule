import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { importantCreateSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";
import { expandRange, toISO } from "@/lib/dates";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { team_id } = await requireTeam();
    const body = await req.json();
    const { from, to, label, color_key, notes } = importantCreateSchema.parse(body);
    if (from > to) return jsonError("'from' must be on or before 'to'");

    const db = supabaseAdmin();
    const rows = expandRange(from, to).map((d) => ({
      team_id,
      date: toISO(d),
      label,
      color_key,
      notes: notes ?? null,
    }));

    const { data, error } = await db
      .from("important_dates")
      .insert(rows)
      .select("id, date, label, color_key, notes");
    if (error) throw error;

    return NextResponse.json({ ok: true, dates: data });
  } catch (err) {
    return handleError(err);
  }
}
