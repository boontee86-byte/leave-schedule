import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { loginSchema } from "@/lib/schema";
import { handleError, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, password } = loginSchema.parse(body);
    const db = supabaseAdmin();

    const { data, error } = await db
      .from("teams")
      .select("id, name, password_hash")
      .eq("name", name)
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonError("Team not found or password incorrect", 401);

    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) return jsonError("Team not found or password incorrect", 401);

    const session = await getSession();
    session.team_id = data.id;
    session.team_name = data.name;
    await session.save();

    return NextResponse.json({ ok: true, team: { id: data.id, name: data.name } });
  } catch (err) {
    return handleError(err);
  }
}
