"use client";

import { useState } from "react";
import type { Member } from "./types";
import Modal from "./Modal";

type Props = {
  members: Member[];
  onClose: () => void;
  onChanged: () => void;
};

export default function MemberDialog({ members, onClose, onChanged }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not add");
      setName("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add");
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string) {
    const next = editing[id]?.trim();
    if (!next) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not rename");
      setEditing((s) => {
        const c = { ...s };
        delete c[id];
        return c;
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, memberName: string) {
    if (!confirm(`Remove ${memberName}? Their leave history will also disappear from the grid.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Could not remove");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Team members"
      onClose={onClose}
      footer={
        <div className="text-right">
          <button
            onClick={onClose}
            className="text-sm rounded-full px-4 py-2 bg-ink text-white"
          >
            Done
          </button>
        </div>
      }
    >
      <form onSubmit={add} className="flex gap-2 mb-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a member by name"
          required
          minLength={1}
          maxLength={60}
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-leave-full"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-ink text-white px-4 text-sm hover:opacity-90 disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {members.length === 0 ? (
        <p className="text-sm text-muted">No members yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {members.map((m) => {
            const isEditing = m.id in editing;
            return (
              <li key={m.id} className="flex items-center gap-2 py-2">
                {isEditing ? (
                  <>
                    <input
                      value={editing[m.id]}
                      onChange={(e) =>
                        setEditing((s) => ({ ...s, [m.id]: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => rename(m.id)}
                      disabled={busy}
                      className="text-sm rounded-full px-3 py-1.5 bg-leave-full/70"
                    >
                      Save
                    </button>
                    <button
                      onClick={() =>
                        setEditing((s) => {
                          const c = { ...s };
                          delete c[m.id];
                          return c;
                        })
                      }
                      className="text-sm text-muted hover:text-ink"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{m.name}</span>
                    <button
                      onClick={() => setEditing((s) => ({ ...s, [m.id]: m.name }))}
                      className="text-xs text-muted hover:text-ink"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => remove(m.id, m.name)}
                      className="text-xs text-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <div className="mt-4 text-sm rounded-lg px-3 py-2 border" style={{ backgroundColor: "#FBE4E8", borderColor: "#EAC4C9", color: "#5A2A35" }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
