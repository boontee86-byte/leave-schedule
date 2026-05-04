"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { LEAVE_META, LEAVE_TYPES, type LeaveType } from "@/lib/colors";
import { fromISO, toISO } from "@/lib/dates";
import type { LeaveEntry, Member } from "./types";
import type { LeaveModalState } from "./Dashboard";
import Modal from "./Modal";

type Props = {
  state: LeaveModalState;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
};

export default function LeaveModal({ state, members, onClose, onSaved }: Props) {
  const isEdit = state.mode === "edit";
  const initialEntry: LeaveEntry | null = isEdit ? state.entry : null;

  const [memberId, setMemberId] = useState<string>(
    isEdit ? initialEntry!.member_id : state.member_id ?? members[0]?.id ?? "",
  );
  const initialDate = isEdit
    ? fromISO(initialEntry!.date)
    : state.date
    ? fromISO(state.date)
    : new Date();
  const [range, setRange] = useState<DateRange | undefined>({
    from: initialDate,
    to: initialDate,
  });
  const [type, setType] = useState<LeaveType>(
    isEdit ? initialEntry!.leave_type : "full_day",
  );
  const [notes, setNotes] = useState<string>(initialEntry?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!memberId) return setError("Select a member");
    if (!range?.from) return setError("Pick a date");
    setBusy(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/leave/${initialEntry!.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ leave_type: type, notes: notes || null }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      } else {
        const from = toISO(range.from);
        const to = toISO(range.to ?? range.from);
        const res = await fetch("/api/leave", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            member_id: memberId,
            from,
            to,
            leave_type: type,
            notes: notes || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm("Remove this leave entry?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/leave/${initialEntry!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit leave" : "Log leave"}
      onClose={onClose}
      wide
      footer={
        <div className="flex items-center justify-between">
          <div>
            {isEdit && (
              <button
                onClick={remove}
                disabled={busy}
                className="text-sm hover:underline"
                style={{ color: "#5A2A35" }}
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm rounded-full px-4 py-2 border border-line bg-white hover:bg-canvas"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="text-sm rounded-full px-4 py-2 bg-ink text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
            Team member
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            disabled={isEdit}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-leave-full disabled:bg-canvas/60"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <label className="block text-xs uppercase tracking-wide text-muted mb-1.5 mt-4">
            Leave type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LEAVE_TYPES.map((t) => {
              const meta = LEAVE_META[t];
              const active = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 transition ${
                    active ? "border-ink/50 bg-canvas" : "border-line bg-white hover:bg-canvas/60"
                  }`}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          <label className="block text-xs uppercase tracking-wide text-muted mb-1.5 mt-4">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leave-full"
          />
          {error && (
            <div className="mt-3 text-sm rounded-lg px-3 py-2 border" style={{ backgroundColor: "#FBE4E8", borderColor: "#EAC4C9", color: "#5A2A35" }}>
              {error}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
            {isEdit ? "Date" : "Pick date(s)"}
          </label>
          <div className="rounded-lg border border-line p-2 bg-white">
            {isEdit ? (
              <DayPicker
                mode="single"
                selected={initialDate}
                disabled
              />
            ) : (
              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                weekStartsOn={1}
                showOutsideDays
              />
            )}
          </div>
          {!isEdit && (
            <p className="text-xs text-muted mt-2">
              Pick a single day or drag to select a range. One entry will be created per date.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
