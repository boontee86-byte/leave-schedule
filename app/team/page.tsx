import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Dashboard from "./components/Dashboard";
import { defaultRange } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session.team_id || !session.team_name) redirect("/");
  const initialRange = defaultRange();
  return (
    <Dashboard
      initialTeam={{ id: session.team_id, name: session.team_name }}
      initialRange={initialRange}
    />
  );
}
