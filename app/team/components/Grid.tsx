"use client";

import { useMemo } from "react";
import { dayName, expandRange, fullDate, isWeekend, monthLabel, toISO } from "@/lib/dates";
import { LEAVE_META, importantHex } from "@/lib/colors";
import type { LeaveEntry, ImportantDate, Member, Range } from "./types";

type Props = {
  range: Range;
  members: Member[];
  entries: LeaveEntry[];
  important: ImportantDate[];
  onCellClick: (member_id: string, date: string) => void;
  onEntryClick: (entry: LeaveEntry) => void;
  onDateLabelClick: (date: string) => void;
};

export default function Grid({
  range,
  members,
  entries,
  important,
  onCellClick,
  onEntryClick,
  onDateLabelClick,
}: Props) {
  const dates = useMemo(() => expandRange(range.from, range.to), [range]);

  const byCell = useMemo(() => {
    const m = new Map<string, LeaveEntry[]>();
    for (const e of entries) {
      const key = `${e.member_id}|${e.date}`;
      const arr = m.get(key);
      if (arr) arr.push(e);
      else m.set(key, [e]);
    }
    return m;
  }, [entries]);

  const byDate = useMemo(() => {
    const m = new Map<string, ImportantDate[]>();
    for (const d of important) {
      const arr = m.get(d.date);
      if (arr) arr.push(d);
      else m.set(d.date, [d]);
    }
    return m;
  }, [important]);

  let lastMonth = "";

  const DAY_W = 64;
  const DATE_W = 220;
  const colTemplate = `${DAY_W}px ${DATE_W}px repeat(${members.length}, minmax(120px, 1fr))`;

  return (
    <div className="overflow-auto max-h-[calc(100vh-180px)]">
      <div className="min-w-fit" style={{ display: "grid", gridTemplateColumns: colTemplate }}>
        {/* Header row */}
        <div
          className="sticky top-0 z-20 bg-white border-b border-line px-3 py-2 text-[11px] uppercase tracking-wide text-muted"
          style={{ left: 0 }}
        >
          Day
        </div>
        <div
          className="sticky top-0 z-20 bg-white border-b border-r border-line px-3 py-2 text-[11px] uppercase tracking-wide text-muted"
          style={{ left: DAY_W }}
        >
          Date
        </div>
        {members.map((m) => (
          <div
            key={m.id}
            className="sticky top-0 z-10 bg-white border-b border-line px-3 py-2 text-sm font-medium text-ink truncate"
            title={m.name}
          >
            {m.name}
          </div>
        ))}

        {/* Body rows */}
        {dates.map((d) => {
          const iso = toISO(d);
          const weekend = isWeekend(d);
          const imp = byDate.get(iso);
          const month = monthLabel(d);
          const showMonth = month !== lastMonth;
          lastMonth = month;
          const rowBg = weekend ? "bg-weekend" : "bg-white";

          return (
            <RowGroup
              key={iso}
              iso={iso}
              dayText={dayName(d)}
              dateText={fullDate(d)}
              weekend={weekend}
              monthHeader={showMonth ? month : null}
              rowBg={rowBg}
              important={imp}
              members={members}
              byCell={byCell}
              dayWidth={DAY_W}
              onCellClick={onCellClick}
              onEntryClick={onEntryClick}
              onDateLabelClick={onDateLabelClick}
            />
          );
        })}
      </div>
    </div>
  );
}

function RowGroup({
  iso,
  dayText,
  dateText,
  weekend,
  monthHeader,
  rowBg,
  important,
  members,
  byCell,
  dayWidth,
  onCellClick,
  onEntryClick,
  onDateLabelClick,
}: {
  iso: string;
  dayText: string;
  dateText: string;
  weekend: boolean;
  monthHeader: string | null;
  rowBg: string;
  important?: ImportantDate[];
  members: Member[];
  byCell: Map<string, LeaveEntry[]>;
  dayWidth: number;
  onCellClick: (member_id: string, date: string) => void;
  onEntryClick: (entry: LeaveEntry) => void;
  onDateLabelClick: (date: string) => void;
}) {
  const accent = important?.[0];
  return (
    <>
      {monthHeader && (
        <div
          className="bg-canvas text-[11px] uppercase tracking-wider text-muted px-3 py-1.5 border-b border-line"
          style={{ gridColumn: `1 / span ${members.length + 2}` }}
        >
          {monthHeader}
        </div>
      )}
      <div
        className={`sticky z-10 ${rowBg} border-b border-line px-3 py-2 text-sm flex items-center justify-center ${
          weekend ? "text-muted/90" : "text-ink/80"
        }`}
        style={{
          left: 0,
          ...(accent ? { boxShadow: `inset 4px 0 0 ${importantHex(accent.color_key)}` } : {}),
        }}
      >
        <span className="font-medium tabular-nums tracking-wide">{dayText}</span>
      </div>
      <button
        type="button"
        onClick={() => onDateLabelClick(iso)}
        className={`sticky z-10 ${rowBg} border-b border-r border-line px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-canvas transition`}
        title="Click to mark this date as important"
        style={{ left: dayWidth }}
      >
        <span className="font-medium text-ink/90 whitespace-nowrap tabular-nums">{dateText}</span>
        {important && important.length > 0 && (
          <span
            className="text-[11px] rounded-full px-2 py-0.5 truncate min-w-0"
            style={{ backgroundColor: importantHex(important[0].color_key) }}
            title={important.map((i) => i.label).join(" · ")}
          >
            {important[0].label}
            {important.length > 1 ? ` +${important.length - 1}` : ""}
          </span>
        )}
      </button>
      {members.map((m) => {
        const cellEntries = byCell.get(`${m.id}|${iso}`) ?? [];
        return (
          <div
            key={m.id + iso}
            className={`relative ${rowBg} border-b border-line min-h-[42px] p-1 flex flex-wrap gap-1 items-center cursor-pointer hover:bg-canvas/70`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("[data-pill]")) return;
              onCellClick(m.id, iso);
            }}
          >
            {cellEntries.length === 0 ? (
              <span className="sr-only">Working</span>
            ) : (
              cellEntries.map((entry) => {
                const meta = LEAVE_META[entry.leave_type];
                return (
                  <button
                    type="button"
                    key={entry.id}
                    data-pill
                    onClick={(e) => {
                      e.stopPropagation();
                      onEntryClick(entry);
                    }}
                    className="text-[11px] font-medium rounded-md px-2 py-1 hover:opacity-90 transition"
                    style={{ backgroundColor: meta.color, color: meta.textColor }}
                    title={`${meta.label}${entry.notes ? ` — ${entry.notes}` : ""}`}
                  >
                    {meta.short}
                  </button>
                );
              })
            )}
          </div>
        );
      })}
    </>
  );
}
