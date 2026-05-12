"use client";

import { useMemo } from "react";
import { fromISO, isWeekend } from "@/lib/dates";
import { isPublicHoliday } from "@/lib/holidays";
import type { LeaveEntry, Member } from "./types";

type Props = {
  members: Member[];
  entries: LeaveEntry[];
};

type Buckets = { annual: number; family: number; medical: number };

function emptyBuckets(): Buckets {
  return { annual: 0, family: 0, medical: 0 };
}

function fmt(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}

export default function MemberSummary({ members, entries }: Props) {
  const totals = useMemo(() => {
    const map = new Map<string, Buckets>();
    for (const m of members) map.set(m.id, emptyBuckets());
    for (const e of entries) {
      const b = map.get(e.member_id);
      if (!b) continue;
      if (isWeekend(fromISO(e.date)) || isPublicHoliday(e.date)) continue;
      switch (e.leave_type) {
        case "full_day":
        case "full_day_block":
          b.annual += 1;
          break;
        case "half_day_am":
        case "half_day_pm":
          b.annual += 0.5;
          break;
        case "childcare":
          b.family += 1;
          break;
        case "childcare_am":
        case "childcare_pm":
          b.family += 0.5;
          break;
        case "medical":
          b.medical += 1;
          break;
        case "medical_am":
        case "medical_pm":
          b.medical += 0.5;
          break;
      }
    }
    return map;
  }, [members, entries]);

  return (
    <aside className="rounded-xl2 border border-line bg-white shadow-soft p-4 h-fit">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted">
          Members ({members.length})
        </div>
        <div className="text-[10px] text-muted">days / year</div>
      </div>
      {members.length === 0 ? (
        <div className="text-sm text-muted">No members yet.</div>
      ) : (
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1.5 text-sm items-center">
          <div className="text-[10px] uppercase tracking-wider text-muted" />
          <div
            className="text-[10px] uppercase tracking-wider text-muted text-right"
            title="Annual: Full day + Block + 0.5 × Half day"
          >
            AL
          </div>
          <div
            className="text-[10px] uppercase tracking-wider text-muted text-right"
            title="Family / Childcare leave"
          >
            F/C
          </div>
          <div
            className="text-[10px] uppercase tracking-wider text-muted text-right"
            title="Medical leave"
          >
            Med
          </div>
          {members.map((m) => {
            const b = totals.get(m.id) ?? emptyBuckets();
            return (
              <FragmentRow
                key={m.id}
                name={m.name}
                annual={b.annual}
                family={b.family}
                medical={b.medical}
              />
            );
          })}
        </div>
      )}
    </aside>
  );
}

function FragmentRow({
  name,
  annual,
  family,
  medical,
}: {
  name: string;
  annual: number;
  family: number;
  medical: number;
}) {
  return (
    <>
      <div className="truncate text-ink/90" title={name}>
        {name}
      </div>
      <div className="text-right tabular-nums text-ink/80">{fmt(annual)}</div>
      <div className="text-right tabular-nums text-ink/80">{fmt(family)}</div>
      <div className="text-right tabular-nums text-ink/80">{fmt(medical)}</div>
    </>
  );
}
