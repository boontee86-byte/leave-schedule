"use client";

import { useMemo } from "react";
import { LEAVE_META, LEAVE_TYPES, type LeaveType } from "@/lib/colors";
import type { LeaveEntry, Range } from "./types";

type Props = {
  entries: LeaveEntry[];
  range: Range;
};

export default function Legend({ entries, range }: Props) {
  const counts = useMemo(() => {
    const c = Object.fromEntries(
      LEAVE_TYPES.map((t) => [t, 0]),
    ) as Record<LeaveType, number>;
    for (const e of entries) {
      if (e.leave_type in c) c[e.leave_type] += 1;
    }
    return c;
  }, [entries]);

  return (
    <aside className="rounded-xl2 border border-line bg-white shadow-soft p-4 h-fit">
      <div className="text-xs uppercase tracking-wider text-muted mb-1">Year</div>
      <div className="text-sm mb-4 text-ink/90 tabular-nums">
        {range.from} → {range.to}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted mb-2">Legend</div>
      <ul className="space-y-1.5">
        {LEAVE_TYPES.map((t) => {
          const meta = LEAVE_META[t];
          return (
            <li key={t} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block h-3.5 w-3.5 rounded shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="truncate">{meta.label}</span>
              </span>
              <span className="text-muted text-xs tabular-nums ml-2">
                {counts[t]}
              </span>
            </li>
          );
        })}
        <li className="flex items-center gap-2 text-sm">
          <span className="inline-block h-3.5 w-3.5 rounded bg-leave-important" />
          <span>Important date</span>
        </li>
      </ul>
    </aside>
  );
}
