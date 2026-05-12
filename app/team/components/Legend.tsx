"use client";

import { useMemo, useState } from "react";
import { LEAVE_META, PUBLIC_HOLIDAY_COLOR, importantHex } from "@/lib/colors";
import { fromISO, fullDate } from "@/lib/dates";
import { holidaysInRange } from "@/lib/holidays";
import type { ImportantDate, Range } from "./types";

type Props = {
  range: Range;
  important: ImportantDate[];
  onEditImportant: (d: ImportantDate) => void;
  onReload: () => void;
};

type CategoryRow = {
  key: string;
  label: string;
  color: string;
};

const CATEGORY_ROWS: CategoryRow[] = [
  { key: "annual",    label: "Annual leave",      color: LEAVE_META.full_day.color },
  { key: "block",     label: "Mandatory leave",   color: LEAVE_META.full_day_block.color },
  { key: "medical",   label: "Medical leave",     color: LEAVE_META.medical.color },
  { key: "childcare", label: "Family / Childcare", color: LEAVE_META.childcare.color },
];

export default function Legend({ range, important, onEditImportant, onReload }: Props) {
  const [showHolidays, setShowHolidays] = useState(true);
  const [showImportant, setShowImportant] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const holidays = holidaysInRange(range.from, range.to);

  const importantInRange = useMemo(() => {
    return important
      .filter((d) => d.date >= range.from && d.date <= range.to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [important, range.from, range.to]);

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
    <div className="space-y-4">
      <aside className="rounded-xl2 border border-line bg-white shadow-soft p-4 h-fit">
        <div className="text-xs uppercase tracking-wider text-muted mb-1">Year</div>
        <div className="text-sm mb-4 text-ink/90 tabular-nums">
          {range.from} → {range.to}
        </div>
        <div className="text-xs uppercase tracking-wider text-muted mb-2">Legend</div>
        <ul className="space-y-1.5">
          {CATEGORY_ROWS.map((row) => (
            <li key={row.key} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3.5 w-3.5 rounded shrink-0"
                style={{ backgroundColor: row.color }}
              />
              <span className="truncate">{row.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      <aside className="rounded-xl2 border border-line bg-white shadow-soft p-4 h-fit">
        <button
          type="button"
          onClick={() => setShowImportant((s) => !s)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded bg-leave-important" />
            <span className="text-xs uppercase tracking-wider text-muted">
              Important dates
            </span>
          </span>
          <span className="text-xs text-muted">{showImportant ? "Hide" : "Show"}</span>
        </button>

        {showImportant && (
          importantInRange.length === 0 ? (
            <div className="mt-3 text-xs text-muted">No important dates in this range.</div>
          ) : (
            <ul className="mt-3 space-y-1 text-xs">
              {importantInRange.map((d) => (
                <li key={d.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditImportant(d)}
                    className="flex-1 min-w-0 flex items-baseline gap-2 text-left rounded px-1 -mx-1 py-0.5 hover:bg-canvas"
                    title="Click to edit"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0 translate-y-[1px]"
                      style={{ backgroundColor: importantHex(d.color_key) }}
                    />
                    <span className="tabular-nums text-muted shrink-0">
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
                    className="shrink-0 text-muted hover:text-ink rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-40 text-sm leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </aside>

      <aside className="rounded-xl2 border border-line bg-white shadow-soft p-4 h-fit">
        <button
          type="button"
          onClick={() => setShowHolidays((s) => !s)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-3.5 w-3.5 rounded"
              style={{ backgroundColor: PUBLIC_HOLIDAY_COLOR }}
            />
            <span className="text-xs uppercase tracking-wider text-muted">
              Public holidays
            </span>
          </span>
          <span className="text-xs text-muted">{showHolidays ? "Hide" : "Show"}</span>
        </button>

        {showHolidays && (
          holidays.length === 0 ? (
            <div className="mt-3 text-xs text-muted">No public holidays in this range.</div>
          ) : (
            <ul className="mt-3 space-y-1 text-xs">
              {holidays.map((h) => (
                <li key={h.date} className="flex items-baseline gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0 translate-y-[1px]"
                    style={{ backgroundColor: PUBLIC_HOLIDAY_COLOR }}
                  />
                  <span className="tabular-nums text-muted shrink-0">
                    {fullDate(fromISO(h.date))}
                  </span>
                  <span className="text-ink/80 truncate">{h.label}</span>
                </li>
              ))}
            </ul>
          )
        )}
      </aside>
    </div>
  );
}
