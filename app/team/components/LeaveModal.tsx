"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  LEAVE_META,
  categoryAndPeriod,
  toLeaveType,
  type LeaveCategory,
  type LeavePeriod,
} from "@/lib/colors";
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

const CATEGORIES: { value: LeaveCategory; label: string }[] = [
  { value: "annual",    label: "Annual leave" },
  { value: "medical",   label: "Medical leave" },
  { value: "childcare", label: "Family / Childcare" },
  { value: "block",     label: "Mandatory leave" },
];

const PERIODS: { value: LeavePeriod; label: string }[] = [
  { value: "full", label: "Full day" },
  { value: "am",   label: "Half day (AM)" },
  { value: "pm",   label: "Half day (PM)" },
];

export default function LeaveModal({ state, members, onClose, onSaved }: Props) {
  const isEdit = state.mode === "edit";
  const initialEntry: LeaveEntry | null = isEdit ? state.entry : null;

  const initialCatPeriod = isEdit
    ? categoryAndPeriod(initialEntry!.leave_type)
    : { category: "annual" as LeaveCategory, period: "full" as LeavePeriod };

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
  const [category, setCategory] = useState<LeaveCategory>(initialCatPeriod.category);
  const [period, setPeriod] = useState<LeavePeriod>(initialCatPeriod.period);
  const [notes, setNotes] = useState<string>(initialEntry?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodAllowed = category !== "block";
  const effectivePeriod: LeavePeriod = periodAllowed ? period : "full";
  const leaveType = toLeaveType(category, effectivePeriod);

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
          body: JSON.stringify({ leave_type: leaveType, notes: notes || null }),
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
            leave_type: leaveType,
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
    if (!range?.from) return setError("Pick a date or range to remove");
    const from = toISO(range.from);
    const to = toISO(range.to ?? range.from);
    const prompt =
      from === to
        ? `Remove all leave for this member on ${from}?`
        : `Remove all leave for this member from ${from} to ${to}?`;
    if (!confirm(prompt)) return;
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        member_id: initialEntry!.member_id,
        from,
        to,
      });
      const res = await fetch(`/api/leave?${qs.toString()}`, { method: "DELETE" });
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
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
            {CATEGORIES.map((c) => {
              const previewType = toLeaveType(c.value, "full");
              const meta = LEAVE_META[previewType];
              const active = c.value === category;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-2 text-sm rounded-lg border px-3 transition text-left min-h-[48px] ${
                    active ? "border-ink/50 bg-canvas" : "border-line bg-white hover:bg-canvas/60"
                  }`}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="leading-tight">{c.label}</span>
                </button>
              );
            })}
          </div>

          {periodAllowed && (
            <>
              <label className="block text-xs uppercase tracking-wide text-muted mb-1.5 mt-4">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PERIODS.map((p) => {
                  const active = p.value === period;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPeriod(p.value)}
                      className={`text-sm rounded-lg border px-3 py-2 transition ${
                        active ? "border-ink/50 bg-canvas" : "border-line bg-white hover:bg-canvas/60"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

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
            {isEdit ? "Pick day(s) to remove" : "Pick date(s)"}
          </label>
          <div
            className="rounded-lg border border-line px-3 py-3 bg-white flex justify-center"
            style={
              {
                "--rdp-day-width": "34px",
                "--rdp-day-height": "34px",
                "--rdp-day_button-width": "32px",
                "--rdp-day_button-height": "32px",
              } as React.CSSProperties
            }
          >
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              weekStartsOn={1}
              showOutsideDays
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {isEdit
              ? "Click a day or drag to select a range, then Remove to delete all leave for this member in that period."
              : "Pick a single day or drag to select a range. Weekends and public holidays are skipped automatically."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
