import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (session.team_id) redirect("/team");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-canvas">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-leave-full/70 flex items-center justify-center">
            <span className="text-xl">·</span>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Leave Schedule</h1>
          <p className="mt-2 text-sm text-muted">
            A private calendar for your team. Sign in with your team password.
          </p>
        </header>
        <LoginForm />
      </div>
      <footer className="mt-10 text-xs text-muted/80 text-center">
        Made for small teams · No tracking · No third-party scripts
      </footer>
    </main>
  );
}
