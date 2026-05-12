import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireTeam } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export async function POST(req: Request) {
  try {
    const { team_id } = await requireTeam();
    const { ids } = schema.parse(await req.json());

    const db = supabaseAdmin();
    await Promise.all(
      ids.map((id, idx) =>
        db
          .from("members")
          .update({ sort_order: idx })
          .eq("id", id)
          .eq("team_id", team_id)
          .is("deleted_at", null),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
