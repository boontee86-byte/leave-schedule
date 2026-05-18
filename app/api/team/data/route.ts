import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { dataQuerySchema } from "@/lib/schema";
import { handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { team_id, team_name } = await requireTeam();
    const url = new URL(req.url);
    const { from, to } = dataQuerySchema.parse({
      from: url.searchParams.get("from") ?? "",
      to: url.searchParams.get("to") ?? "",
    });
    const db = supabaseAdmin();
    const year = parseInt(from.slice(0, 4), 10);

    const [members, leave, important, balances] = await Promise.all([
      db
        .from("members")
        .select("id, name, sort_order")
        .eq("team_id", team_id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      db
        .from("leave_entries")
        .select("id, member_id, date, leave_type, notes")
        .eq("team_id", team_id)
        .gte("date", from)
        .lte("date", to),
      db
        .from("important_dates")
        .select("id, date, label, color_key, notes")
        .eq("team_id", team_id)
        .gte("date", from)
        .lte("date", to),
      db
        .from("member_leave_balances")
        .select(
          "member_id, year, entitlement_annual, entitlement_medical, entitlement_childcare, carry_forward_annual, in_lieu_annual",
        )
        .eq("team_id", team_id)
        .eq("year", year),
    ]);

    if (members.error) throw members.error;
    if (leave.error) throw leave.error;
    if (important.error) throw important.error;
    if (balances.error) throw balances.error;

    const numericFields = [
      "entitlement_annual",
      "entitlement_medical",
      "entitlement_childcare",
      "carry_forward_annual",
      "in_lieu_annual",
    ] as const;
    const normalizedBalances = (balances.data ?? []).map((row) => {
      const out: Record<string, unknown> = { member_id: row.member_id, year: row.year };
      for (const f of numericFields) out[f] = Number(row[f]);
      return out;
    });

    return NextResponse.json({
      team: { id: team_id, name: team_name },
      members: members.data,
      leave_entries: leave.data,
      important_dates: important.data,
      balances: normalizedBalances,
      year,
    });
  } catch (err) {
    return handleError(err);
  }
}
