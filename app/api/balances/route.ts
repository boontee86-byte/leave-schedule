import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { balanceUpsertSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  try {
    const { team_id } = await requireTeam();
    const body = await req.json();
    const { year, balances } = balanceUpsertSchema.parse(body);
    if (balances.length === 0) return NextResponse.json({ ok: true });

    const db = supabaseAdmin();

    const memberIds = Array.from(new Set(balances.map((b) => b.member_id)));
    const owned = await db
      .from("members")
      .select("id")
      .eq("team_id", team_id)
      .is("deleted_at", null)
      .in("id", memberIds);
    if (owned.error) throw owned.error;
    const ownedSet = new Set((owned.data ?? []).map((m) => m.id));
    const stranger = memberIds.find((id) => !ownedSet.has(id));
    if (stranger) return jsonError("Member not found", 404);

    const rows = balances.map((b) => ({ team_id, year, ...b }));
    const { error } = await db
      .from("member_leave_balances")
      .upsert(rows, { onConflict: "member_id,year" });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
