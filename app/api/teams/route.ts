import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { createTeamSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, password } = createTeamSchema.parse(body);
    const db = supabaseAdmin();

    const existing = await db.from("teams").select("id").eq("name", name).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return jsonError("A team with that name already exists", 409);

    const hash = await bcrypt.hash(password, 12);
    const { data, error } = await db
      .from("teams")
      .insert({ name, password_hash: hash })
      .select("id, name")
      .single();
    if (error) throw error;

    const session = await getSession();
    session.team_id = data.id;
    session.team_name = data.name;
    await session.save();

    return NextResponse.json({ ok: true, team: { id: data.id, name: data.name } });
  } catch (err) {
    return handleError(err);
  }
}
