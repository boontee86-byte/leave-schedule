"use client";

import { useMemo } from "react";
import { expandRange, groupDatesByMonth, isWeekend, toISO } from "@/lib/dates";
import {
  AM_TYPES,
  LEAVE_META,
  PM_TYPES,
  PUBLIC_HOLIDAY_COLOR,
  WEEKEND_COLOR,
  importantHex,
} from "@/lib/colors";
import { holidayFor } from "@/lib/holidays";
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

const MEMBER_COL_VAR = "var(--member-col)";
const CELL = 22;
const GAP = 3;
const EMPTY_BG = "#ebedf0";
const STICKY_SHADOW = "2px 0 4px -2px rgba(0,0,0,0.08)";

export default function Grid({
  range,
  members,
  entries,
  important,
  onCellClick,
  onEntryClick,
  onDateLabelClick,
}: Props) {
  const months = useMemo(
    () => groupDatesByMonth(expandRange(range.from, range.to)),
    [range],
  );

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

  return (
    <div className="flex flex-col gap-7">
      {months.map((m) => (
        <MonthGrid
          key={m.label}
          label={m.label}
          days={m.days}
          members={members}
          byCell={byCell}
          byDate={byDate}
          onCellClick={onCellClick}
          onEntryClick={onEntryClick}
          onDateLabelClick={onDateLabelClick}
        />
      ))}
    </div>
  );
}

function MonthGrid({
  label,
  days,
  members,
  byCell,
  byDate,
  onCellClick,
  onEntryClick,
  onDateLabelClick,
}: {
  label: string;
  days: Date[];
  members: Member[];
  byCell: Map<string, LeaveEntry[]>;
  byDate: Map<string, ImportantDate[]>;
  onCellClick: (member_id: string, date: string) => void;
  onEntryClick: (entry: LeaveEntry) => void;
  onDateLabelClick: (date: string) => void;
}) {
  const colTemplate = `${MEMBER_COL_VAR} repeat(${days.length}, ${CELL}px)`;

  return (
    <section>
      <h3 className="text-sm font-medium text-ink/90 mb-2 px-1">{label}</h3>

      <div className="overflow-x-auto">
        <div
          className="inline-block"
          style={{
            display: "grid",
            gridTemplateColumns: colTemplate,
            columnGap: GAP,
            rowGap: GAP,
          }}
        >
          {/* Day-of-week header row */}
          <div className="sticky left-0 z-20 bg-canvas" style={{ boxShadow: STICKY_SHADOW }} />
          {days.map((d) => {
            const we = isWeekend(d);
            return (
              <div
                key={`dow-${toISO(d)}`}
                className={`text-center text-[9px] uppercase tracking-wider ${
                  we ? "text-ink/60 font-medium" : "text-muted/70"
                }`}
                style={{ width: CELL }}
              >
                {"SMTWTFS"[d.getDay()]}
              </div>
            );
          })}

          {/* Day-number header row */}
          <div className="sticky left-0 z-20 bg-canvas" style={{ boxShadow: STICKY_SHADOW }} />
          {days.map((d) => {
            const iso = toISO(d);
            const we = isWeekend(d);
            const imp = byDate.get(iso);
            const accent = imp?.[0];
            const ph = holidayFor(iso);
            const labels: string[] = [];
            if (ph) labels.push(`Public holiday — ${ph.label}`);
            if (imp && imp.length > 0) {
              for (const i of imp) labels.push(`${i.label}${i.notes ? ` — ${i.notes}` : ""}`);
            }
            const tooltip = labels.length > 0 ? labels.join("\n") : "Click to mark as important";
            const showAccent = accent || ph;
            const accentBg = accent ? importantHex(accent.color_key) : PUBLIC_HOLIDAY_COLOR;
            return (
              <button
                key={`day-${iso}`}
                type="button"
                onClick={() => onDateLabelClick(iso)}
                className={`text-center text-[11px] tabular-nums py-[1px] rounded-[3px] hover:bg-canvas transition flex items-center justify-center ${
                  we || ph ? "text-ink/90 font-medium" : "text-ink/70 hover:text-ink"
                }`}
                style={{ width: CELL, height: 18 }}
                title={tooltip}
              >
                {showAccent ? (
                  <span
                    className="inline-flex items-center justify-center rounded-full font-semibold text-ink"
                    style={{
                      backgroundColor: accentBg,
                      width: 18,
                      height: 18,
                    }}
                  >
                    {d.getDate()}
                  </span>
                ) : (
                  d.getDate()
                )}
              </button>
            );
          })}

          {/* Member rows */}
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              days={days}
              byCell={byCell}
              onCellClick={onCellClick}
              onEntryClick={onEntryClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MemberRow({
  member,
  days,
  byCell,
  onCellClick,
  onEntryClick,
}: {
  member: Member;
  days: Date[];
  byCell: Map<string, LeaveEntry[]>;
  onCellClick: (member_id: string, date: string) => void;
  onEntryClick: (entry: LeaveEntry) => void;
}) {
  return (
    <>
      <div
        className="sticky left-0 z-10 bg-canvas pr-2 flex items-center text-[12px] sm:text-[13px] text-ink/90 truncate"
        style={{ height: CELL, boxShadow: STICKY_SHADOW }}
        title={member.name}
      >
        {member.name}
      </div>
      {days.map((d) => {
        const iso = toISO(d);
        const cellEntries = byCell.get(`${member.id}|${iso}`) ?? [];
        const ph = holidayFor(iso);
        return (
          <DayCell
            key={member.id + iso}
            iso={iso}
            weekend={isWeekend(d)}
            holidayLabel={ph?.label}
            entries={cellEntries}
            onEmptyClick={() => onCellClick(member.id, iso)}
            onEntryClick={onEntryClick}
          />
        );
      })}
    </>
  );
}

function DayCell({
  iso,
  weekend,
  holidayLabel,
  entries,
  onEmptyClick,
  onEntryClick,
}: {
  iso: string;
  weekend: boolean;
  holidayLabel?: string;
  entries: LeaveEntry[];
  onEmptyClick: () => void;
  onEntryClick: (entry: LeaveEntry) => void;
}) {
  const baseStyle: React.CSSProperties = {
    width: CELL,
    height: CELL,
    borderRadius: 3,
  };

  if (weekend) {
    return (
      <div
        style={{ ...baseStyle, backgroundColor: WEEKEND_COLOR }}
        title="Weekend"
        aria-label="Weekend"
      />
    );
  }

  if (holidayLabel) {
    return (
      <div
        style={{ ...baseStyle, backgroundColor: PUBLIC_HOLIDAY_COLOR }}
        title={`Public holiday — ${holidayLabel}`}
        aria-label={`Public holiday — ${holidayLabel}`}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <button
        type="button"
        onClick={onEmptyClick}
        className="hover:ring-2 hover:ring-ink/20 transition"
        style={{ ...baseStyle, backgroundColor: EMPTY_BG }}
        aria-label={`Log leave on ${iso}`}
      />
    );
  }

  const tooltip = entries
    .map((e) => {
      const meta = LEAVE_META[e.leave_type];
      return `${meta.label}${e.notes ? ` — ${e.notes}` : ""}`;
    })
    .join(" · ");

  return (
    <button
      type="button"
      onClick={() => onEntryClick(entries[0])}
      title={tooltip}
      className="hover:ring-2 hover:ring-ink/30 transition"
      style={{ ...baseStyle, ...renderFill(entries, EMPTY_BG) }}
    />
  );
}

function renderFill(entries: LeaveEntry[], emptyBg: string): React.CSSProperties {
  if (entries.length === 1) {
    const e = entries[0];
    const color = LEAVE_META[e.leave_type].color;
    if (AM_TYPES.has(e.leave_type)) {
      return {
        background: `linear-gradient(to right, ${color} 50%, ${emptyBg} 50%)`,
      };
    }
    if (PM_TYPES.has(e.leave_type)) {
      return {
        background: `linear-gradient(to right, ${emptyBg} 50%, ${color} 50%)`,
      };
    }
    return { backgroundColor: color };
  }

  const stops: string[] = [];
  const step = 100 / entries.length;
  entries.forEach((e, i) => {
    const color = LEAVE_META[e.leave_type].color;
    const from = (i * step).toFixed(2);
    const to = ((i + 1) * step).toFixed(2);
    stops.push(`${color} ${from}%`, `${color} ${to}%`);
  });
  return { background: `linear-gradient(to right, ${stops.join(", ")})` };
}
