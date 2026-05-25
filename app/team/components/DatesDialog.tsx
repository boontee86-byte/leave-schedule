"use client";

import { useMemo, useState } from "react";
import { PUBLIC_HOLIDAY_COLOR, importantHex } from "@/lib/colors";
import { fromISO, fullDate } from "@/lib/dates";
import { holidaysInRange } from "@/lib/holidays";
import type { ImportantDate, Range } from "./types";
import Modal from "./Modal";

type Props = {
  range: Range;
  important: ImportantDate[];
  onClose: () => void;
  onEditImportant: (d: ImportantDate) => void;
  onAddImportant: () => void;
  onReload: () => void;
};

export default function DatesDialog({
  range,
  important,
  onClose,
  onEditImportant,
  onAddImportant,
  onReload,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const holidays = holidaysInRange(range.from, range.to);

  const importantGroups = useMemo(() => {
    const inRange = important.filter(
      (d) => d.date >= range.from && d.date <= range.to,
    );
    const byColor = new Map<string, ImportantDate[]>();
    for (const d of inRange) {
      const arr = byColor.get(d.color_key);
      if (arr) arr.push(d);
      else byColor.set(d.color_key, [d]);
    }
    return Array.from(byColor.entries())
      .map(([color_key, items]) => ({
        color_key,
        items: items.sort((a, b) => a.date.localeCompare(b.date)),
        firstDate: items.reduce(
          (min, d) => (d.date < min ? d.date : min),
          items[0].date,
        ),
      }))
      .sort((a, b) => a.firstDate.localeCompare(b.firstDate));
  }, [important, range.from, range.to]);

  const hasImportant = importantGroups.length > 0;

  async function deleteImportant(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/important-dates/${id}`, { method: "DELETE" });
      if (res.ok) onReload();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Modal title={`Dates ${range.from.slice(0, 4)}`} onClose={onClose} wide>
      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded bg-leave-important" />
              <h3 className="text-xs uppercase tracking-wider text-muted">
                Important dates
              </h3>
            </div>
            <button
              type="button"
              onClick={onAddImportant}
              className="text-xs rounded-full border border-line bg-white px-3 py-1 hover:bg-canvas"
            >
              + Add
            </button>
          </div>
          {!hasImportant ? (
            <div className="text-xs text-muted">
              No important dates in this range.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {importantGroups.map((group) => (
                <ul
                  key={group.color_key}
                  className="space-y-0.5 border-l-2 pl-2"
                  style={{ borderColor: importantHex(group.color_key) }}
                >
                  {group.items.map((d) => (
                    <li key={d.id} className="group flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditImportant(d)}
                        className="flex-1 min-w-0 flex items-baseline gap-2 text-left rounded px-1 -mx-1 py-0.5 hover:bg-canvas"
                        title="Click to edit"
                      >
                        <span className="font-mono tabular-nums text-muted shrink-0">
                          {fullDate(fromISO(d.date))}
                        </span>
                        <span className="text-ink/80 truncate">{d.label}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteImportant(d.id)}
                        disabled={deletingId === d.id}
                        title="Delete"
                        aria-label={`Delete ${d.label}`}
                        className="shrink-0 text-muted hover:text-ink rounded px-1.5 py-0.5 opacity-60 hover:opacity-100 disabled:opacity-40 text-base leading-none"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block h-3.5 w-3.5 rounded"
              style={{ backgroundColor: PUBLIC_HOLIDAY_COLOR }}
            />
            <h3 className="text-xs uppercase tracking-wider text-muted">
              Public holidays
            </h3>
          </div>
          {holidays.length === 0 ? (
            <div className="text-xs text-muted">
              No public holidays in this range.
            </div>
          ) : (
            <ul className="space-y-0.5 text-xs">
              {holidays.map((h) => (
                <li key={h.date} className="flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-muted shrink-0">
                    {fullDate(fromISO(h.date))}
                  </span>
                  <span className="text-ink/80 truncate">{h.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
