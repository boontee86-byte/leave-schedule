import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type Session = {
  team_id?: string;
  team_name?: string;
};

const COOKIE_NAME = "ls_session";

function options(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 32 characters",
    );
  }
  return {
    password,
    cookieName: COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}

export async function getSession(): Promise<Session & {
  save: () => Promise<void>;
  destroy: () => Promise<void>;
}> {
  const store = await cookies();
  return getIronSession<Session>(store, options()) as unknown as Session & {
    save: () => Promise<void>;
    destroy: () => Promise<void>;
  };
}

export async function requireTeam(): Promise<{ team_id: string; team_name: string }> {
  const s = await getSession();
  if (!s.team_id || !s.team_name) {
    const err = new Error("Unauthorized");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return { team_id: s.team_id, team_name: s.team_name };
}
