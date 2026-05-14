import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { leaveCreateSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";
import { expandRange, isWeekend, toISO } from "@/lib/dates";
import { isPublicHoliday } from "@/lib/holidays";

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

    const rows = expandRange(from, to)
      .filter((d) => !isWeekend(d) && !isPublicHoliday(toISO(d)))
      .map((d) => ({
        team_id,
        member_id,
        date: toISO(d),
        leave_type,
        notes: notes ?? null,
      }));

    const del = await db
      .from("leave_entries")
      .delete()
      .eq("team_id", team_id)
      .eq("member_id", member_id)
      .gte("date", from)
      .lte("date", to);
    if (del.error) throw del.error;

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, entries: [] });
    }

    const { data, error } = await db
      .from("leave_entries")
      .insert(rows)
      .select("id, member_id, date, leave_type, notes");
    if (error) throw error;

    return NextResponse.json({ ok: true, entries: data });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const { team_id } = await requireTeam();
    const url = new URL(req.url);
    const member_id = url.searchParams.get("member_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!member_id || !from || !to) {
      return jsonError("member_id, from, to are required");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return jsonError("from and to must be YYYY-MM-DD");
    }
    if (from > to) return jsonError("'from' must be on or before 'to'");

    const db = supabaseAdmin();
    const { error, count } = await db
      .from("leave_entries")
      .delete({ count: "exact" })
      .eq("team_id", team_id)
      .eq("member_id", member_id)
      .gte("date", from)
      .lte("date", to);
    if (error) throw error;
    return NextResponse.json({ ok: true, deleted: count ?? 0 });
  } catch (err) {
    return handleError(err);
  }
}
