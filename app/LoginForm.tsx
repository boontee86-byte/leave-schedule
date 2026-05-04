"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "join" | "create";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("join");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "create" && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const url = mode === "join" ? "/api/auth/login" : "/api/teams";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong");
      router.push("/team");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl2 bg-white shadow-soft border border-line p-6">
      <div className="mb-5 flex rounded-full bg-canvas p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 rounded-full py-2 transition ${
            mode === "join" ? "bg-white shadow-sm text-ink" : "text-muted"
          }`}
        >
          Join team
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded-full py-2 transition ${
            mode === "create" ? "bg-white shadow-sm text-ink" : "text-muted"
          }`}
        >
          Create team
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
            Team name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={60}
            placeholder="e.g. Phoenix Squad"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-leave-full"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
            {mode === "join" ? "Team password" : "Choose a team password"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "create" ? 6 : 1}
            maxLength={200}
            placeholder={mode === "create" ? "At least 6 characters" : "Enter team password"}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-leave-full"
          />
        </div>
        {mode === "create" && (
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              maxLength={200}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-leave-full"
            />
          </div>
        )}

        {error && (
          <div
            className="text-sm rounded-lg px-3 py-2 border"
            style={{ backgroundColor: "#FBE4E8", borderColor: "#EAC4C9", color: "#5A2A35" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition"
        >
          {busy ? "Please wait…" : mode === "join" ? "Open schedule" : "Create team & open"}
        </button>
      </form>

      <p className="mt-5 text-xs text-muted text-center">
        {mode === "join"
          ? "Don't have a team yet? Switch to Create team."
          : "Anyone with this name and password will be able to view and edit the schedule."}
      </p>
    </div>
  );
}
