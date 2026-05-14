"use client";

import { useMemo, useState } from "react";
import {
  AM_TYPES,
  LEAVE_META,
  PM_TYPES,
  PUBLIC_HOLIDAY_COLOR,
  importantHex,
  type LeaveType,
} from "@/lib/colors";
import { fromISO, fullDate } from "@/lib/dates";
import { holidaysInRange } from "@/lib/holidays";
import type { ImportantDate, Range } from "./types";

export type PaintMode =
  | { kind: "paint"; leave_type: LeaveType }
  | { kind: "erase" }
  | null;

type Props = {
  range: Range;
  important: ImportantDate[];
  paintMode: PaintMode;
  onSetPaintMode: (m: PaintMode) => void;
  onEditImportant: (d: ImportantDate) => void;
  onReload: () => void;
};

type CategoryGroup = {
  key: string;
  label: string;
  full: LeaveType;
  am?: LeaveType;
  pm?: LeaveType;
};

const CHIP_GROUPS: CategoryGroup[] = [
  { key: "annual",    label: "Annual",    full: "full_day",       am: "half_day_am",  pm: "half_day_pm" },
  { key: "medical",   label: "Medical",   full: "medical",        am: "medical_am",   pm: "medical_pm" },
  { key: "childcare", label: "Family/Childcare", full: "childcare",      am: "childcare_am", pm: "childcare_pm" },
  { key: "block",     label: "Mandatory", full: "full_day_block" },
];

const EMPTY_BG = "#ebedf0";

function chipFillStyle(type: LeaveType): React.CSSProperties {
  const color = LEAVE_META[type].color;
  if (AM_TYPES.has(type)) {
    return { background: `linear-gradient(to right, ${color} 50%, ${EMPTY_BG} 50%)` };
  }
  if (PM_TYPES.has(type)) {
    return { background: `linear-gradient(to right, ${EMPTY_BG} 50%, ${color} 50%)` };
  }
  return { backgroundColor: color };
}

export default function Legend({
  range,
  important,
  paintMode,
  onSetPaintMode,
  onEditImportant,
  onReload,
}: Props) {
  const [showHolidays, setShowHolidays] = useState(true);
  const [showImportant, setShowImportant] = useState(true);
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
    return Array.from(byColor.entries()).map(([color_key, items]) => ({
      color_key,
      items: items.sort((a, b) => a.date.localeCompare(b.date)),
      firstDate: items.reduce(
        (min, d) => (d.date < min ? d.date : min),
        items[0].date,
      ),
    })).sort((a, b) => a.firstDate.localeCompare(b.firstDate));
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

  function toggleChip(type: LeaveType) {
    if (paintMode?.kind === "paint" && paintMode.leave_type === type) {
      onSetPaintMode(null);
    } else {
      onSetPaintMode({ kind: "paint", leave_type: type });
    }
  }

  function toggleEraser() {
    if (paintMode?.kind === "erase") onSetPaintMode(null);
    else onSetPaintMode({ kind: "erase" });
  }

  const isActive = (type: LeaveType) =>
    paintMode?.kind === "paint" && paintMode.leave_type === type;
  const isEraserActive = paintMode?.kind === "erase";

  return (
    <div className="space-y-4" data-legend-root>
      <aside className="rounded-xl2 border border-line bg-white shadow-soft p-3 sm:p-4 h-fit">
        <div className="text-xs uppercase tracking-wider text-muted mb-1">Year</div>
        <div className="text-sm mb-3 text-ink/90 tabular-nums">
          {range.from} → {range.to}
        </div>

        <div className="text-xs uppercase tracking-wider text-muted mb-1">Paint leave</div>
        <div className="text-[11px] text-muted mb-2 leading-snug">
          Click a chip, then click or drag on the calendar. Shift-click for ranges. Esc or click outside to exit.
        </div>

        <ul className="space-y-1.5">
          {CHIP_GROUPS.map((g) => (
            <li key={g.key} className="flex items-center gap-2 text-[12px]">
              <span className="flex-1 min-w-0 text-ink/85 whitespace-nowrap">{g.label}</span>
              <div
                className="grid shrink-0"
                style={{ gridTemplateColumns: "repeat(3, 34px)", gap: 4 }}
              >
                <ChipButton
                  type={g.full}
                  label="Full"
                  active={isActive(g.full)}
                  onClick={() => toggleChip(g.full)}
                />
                {g.am ? (
                  <ChipButton
                    type={g.am}
                    label="AM"
                    active={isActive(g.am)}
                    onClick={() => toggleChip(g.am!)}
                  />
                ) : (
                  <span aria-hidden />
                )}
                {g.pm ? (
                  <ChipButton
                    type={g.pm}
                    label="PM"
                    active={isActive(g.pm)}
                    onClick={() => toggleChip(g.pm!)}
                  />
                ) : (
                  <span aria-hidden />
                )}
              </div>
            </li>
          ))}
          <li className="flex items-center gap-2 text-[12px] pt-1">
            <span className="flex-1 min-w-0 text-ink/85 whitespace-nowrap">Eraser</span>
            <div
              className="grid shrink-0"
              style={{ gridTemplateColumns: "repeat(3, 34px)", gap: 4 }}
            >
              <button
                type="button"
                onClick={toggleEraser}
                title="Erase leave on click/drag"
                aria-pressed={isEraserActive}
                className={`inline-flex items-center justify-center h-[22px] w-full min-w-[34px] rounded border text-[13px] leading-none transition ${
                  isEraserActive
                    ? "ring-2 ring-ink/60 ring-offset-1 border-ink/40 bg-canvas"
                    : "border-line bg-white hover:bg-canvas"
                }`}
              >
                <span aria-hidden>🧽</span>
              </button>
              <span aria-hidden />
              <span aria-hidden />
            </div>
          </li>
        </ul>
      </aside>

      <aside className="rounded-xl2 border border-line bg-white shadow-soft p-3 sm:p-4 h-fit">
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
          !hasImportant ? (
            <div className="mt-3 text-xs text-muted">No important dates in this range.</div>
          ) : (
            <div className="mt-3 space-y-3 text-xs">
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
                        className="shrink-0 text-muted hover:text-ink rounded px-1.5 py-0.5 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-40 text-base leading-none"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )
        )}
      </aside>

      <aside className="rounded-xl2 border border-line bg-white shadow-soft p-3 sm:p-4 h-fit">
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
            <ul className="mt-3 space-y-0.5 text-xs">
              {holidays.map((h) => (
                <li key={h.date} className="flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-muted shrink-0">
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

function ChipButton({
  type,
  label,
  active,
  onClick,
}: {
  type: LeaveType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const fill = chipFillStyle(type);
  const meta = LEAVE_META[type];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={meta.label}
      className={`inline-flex items-center justify-center h-[22px] min-w-[34px] px-1 rounded border text-[10px] font-medium leading-none transition ${
        active
          ? "ring-2 ring-ink/60 ring-offset-1 border-ink/40"
          : "border-line hover:ring-1 hover:ring-ink/20"
      }`}
      style={fill}
    >
      <span className="text-ink/80 mix-blend-multiply">{label}</span>
    </button>
  );
}
