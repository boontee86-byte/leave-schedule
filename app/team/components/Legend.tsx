"use client";

import { useMemo } from "react";
import { LEAVE_META, LEAVE_TYPES, type LeaveType } from "@/lib/colors";
import type { LeaveEntry, Member, Range } from "./types";

type Props = {
  entries: LeaveEntry[];
  members: Member[];
  range: Range;
};

export default function Legend({ entries, members, range }: Props) {
  const counts = useMemo(() => {
    const c: Record<LeaveType, number> = {
      full_day: 0,
      half_day_am: 0,
      half_day_pm: 0,
      travel: 0,
      medical: 0,
      childcare: 0,
    };
    for (const e of entries) c[e.leave_type] += 1;
    return c;
  }, [entries]);

  return (
    <aside className="rounded-xl2 border border-line bg-white shadow-soft p-4 h-fit lg:sticky lg:top-[88px]">
      <div className="text-xs uppercase tracking-wider text-muted mb-1">Range</div>
      <div className="text-sm mb-4 text-ink/90">
        {range.from} → {range.to}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted mb-2">Legend</div>
      <ul className="space-y-1.5 mb-4">
        {LEAVE_TYPES.map((t) => {
          const meta = LEAVE_META[t];
          return (
            <li key={t} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 rounded"
                  style={{ backgroundColor: meta.color }}
                />
                <span>{meta.label}</span>
              </span>
              <span className="text-muted text-xs tabular-nums">{counts[t]}</span>
            </li>
          );
        })}
        <li className="flex items-center gap-2 text-sm">
          <span className="inline-block h-3.5 w-3.5 rounded bg-weekend" />
          <span>Weekend</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <span className="inline-block h-3.5 w-3.5 rounded bg-leave-important" />
          <span>Important date</span>
        </li>
      </ul>
      <div className="text-xs uppercase tracking-wider text-muted mb-2">
        Members ({members.length})
      </div>
      <ul className="space-y-1 text-sm text-ink/90 max-h-40 overflow-auto">
        {members.map((m) => (
          <li key={m.id} className="truncate" title={m.name}>
            {m.name}
          </li>
        ))}
      </ul>
    </aside>
  );
}
