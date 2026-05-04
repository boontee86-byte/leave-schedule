import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { leaveCreateSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";
import { expandRange, toISO } from "@/lib/dates";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { team_id } = await requireTeam();
    const body = await req.json();
    const { member_id, from, to, leave_type, notes } = leaveCreateSchema.parse(body);
    if (from > to) return jsonError("'from' must be on or before 'to'");

    const db = supabaseAdmin();
    const member = await db
      .from("members")
      .select("id")
      .eq("id", member_id)
      .eq("team_id", team_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (member.error) throw member.error;
    if (!member.data) return jsonError("Member not found", 404);

    const rows = expandRange(from, to).map((d) => ({
      team_id,
      member_id,
      date: toISO(d),
      leave_type,
      notes: notes ?? null,
    }));

    const { data, error } = await db
      .from("leave_entries")
      .upsert(rows, { onConflict: "member_id,date,leave_type" })
      .select("id, member_id, date, leave_type, notes");
    if (error) throw error;

    return NextResponse.json({ ok: true, entries: data });
  } catch (err) {
    return handleError(err);
  }
}
