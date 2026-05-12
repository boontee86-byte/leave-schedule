"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { IMPORTANT_COLORS, importantHex } from "@/lib/colors";
import { fromISO, toISO } from "@/lib/dates";
import type { ImportantDate } from "./types";
import Modal from "./Modal";

type Props = {
  presetDate?: string;
  editing?: ImportantDate;
  existing: ImportantDate[];
  onClose: () => void;
  onChanged: () => void;
};

export default function ImportantDateDialog({
  presetDate,
  editing,
  existing,
  onClose,
  onChanged,
}: Props) {
  const initial = editing
    ? fromISO(editing.date)
    : presetDate
      ? fromISO(presetDate)
      : new Date();
  const [date, setDate] = useState<Date | undefined>(initial);
  const [label, setLabel] = useState(editing?.label ?? "");
  const [colorKey, setColorKey] = useState<string>(
    editing?.color_key ?? IMPORTANT_COLORS[0].key,
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPreset = useMemo(
    () =>
      presetDate && !editing
        ? existing.filter((e) => e.date === presetDate)
        : [],
    [existing, presetDate, editing],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) return setError("Pick a date");
    setBusy(true);
    try {
      const iso = toISO(date);
      const res = editing
        ? await fetch(`/api/important-dates/${editing.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              date: iso,
              label: label.trim(),
              color_key: colorKey,
              notes: notes || null,
            }),
          })
        : await fetch("/api/important-dates", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              from: iso,
              to: iso,
              label: label.trim(),
              color_key: colorKey,
              notes: notes || null,
            }),
          });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  async function removeOne(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/important-dates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      onChanged();
      if (editing && id === editing.id) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit important date" : "Mark important date"}
      onClose={onClose}
      wide
      footer={
        <div className="flex items-center justify-between gap-2">
          <div>
            {editing && (
              <button
                onClick={() => removeOne(editing.id)}
                disabled={busy}
                className="text-sm rounded-full px-4 py-2 border border-line bg-white text-muted hover:text-ink"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm rounded-full px-4 py-2 border border-line bg-white"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="text-sm rounded-full px-4 py-2 bg-ink text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              Label
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              maxLength={100}
              placeholder="e.g. Public holiday, All-hands meeting"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-leave-full"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              Colour
            </label>
            <div className="flex gap-2">
              {IMPORTANT_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColorKey(c.key)}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    colorKey === c.key ? "border-ink/60" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.key}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leave-full"
            />
          </div>

          {onPreset.length > 0 && (
            <div className="rounded-lg border border-line bg-canvas/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted mb-2">
                Already on {presetDate}
              </div>
              <ul className="space-y-1">
                {onPreset.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded"
                        style={{ backgroundColor: importantHex(d.color_key) }}
                      />
                      {d.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOne(d.id)}
                      className="text-xs text-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="text-sm rounded-lg px-3 py-2 border" style={{ backgroundColor: "#FBE4E8", borderColor: "#EAC4C9", color: "#5A2A35" }}>
              {error}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
            Date
          </label>
          <div className="rounded-lg border border-line p-2 bg-white">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              weekStartsOn={1}
              showOutsideDays
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
