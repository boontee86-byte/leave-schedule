"use client";

import { useMemo } from "react";
import { fromISO, isWeekend } from "@/lib/dates";
import { isPublicHoliday } from "@/lib/holidays";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  available,
  carryForward,
  emptyBalance,
  entitlement,
  hasExtras,
  inLieu,
  type Category,
} from "@/lib/balance";
import type { LeaveEntry, Member, MemberBalance } from "./types";

type Props = {
  members: Member[];
  entries: LeaveEntry[];
  balances: MemberBalance[];
  year: number;
};

type Taken = Record<Category, number>;

function emptyTaken(): Taken {
  return { annual: 0, childcare: 0, medical: 0 };
}

function fmt(n: number): string {
  return n.toFixed(1);
}

export default function MemberSummary({ members, entries, balances, year }: Props) {
  const taken = useMemo(() => {
    const map = new Map<string, Taken>();
    for (const m of members) map.set(m.id, emptyTaken());
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
          b.childcare += 1;
          break;
        case "childcare_am":
        case "childcare_pm":
          b.childcare += 0.5;
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

  const balanceMap = useMemo(() => {
    const map = new Map<string, MemberBalance>();
    for (const m of members) map.set(m.id, emptyBalance(m.id, year));
    for (const b of balances) map.set(b.member_id, b);
    return map;
  }, [members, balances, year]);

  return (
    <aside className="rounded-xl2 border border-line bg-white shadow-soft p-3 sm:p-4 h-fit">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted">
          Members ({members.length})
        </div>
        <div className="text-[10px] text-muted tabular-nums">{year}</div>
      </div>
      {members.length === 0 ? (
        <div className="text-sm text-muted">No members yet.</div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((cat, idx) => {
            const extras = hasExtras(cat);
            const colCount = extras ? 5 : 3;
            return (
              <section key={cat} className={idx > 0 ? "pt-3 border-t border-line" : ""}>
                <h3 className="text-xs font-medium text-ink/90 mb-1.5">
                  {CATEGORY_LABEL[cat]}
                </h3>
                <div
                  className="grid items-center gap-x-1.5 gap-y-1 text-xs"
                  style={{
                    gridTemplateColumns: `minmax(0, 1fr) repeat(${colCount}, 1.875rem)`,
                  }}
                >
                  <div />
                  <ColHead title="Entitlement">Ent</ColHead>
                  {extras && <ColHead title="Brought forward from last year">B/F</ColHead>}
                  {extras && <ColHead title="In-lieu days">I/L</ColHead>}
                  <ColHead title="Leave days taken so far">Tkn</ColHead>
                  <ColHead
                    title={
                      extras
                        ? "Balance = Ent + B/F + I/L − Taken"
                        : "Balance = Ent − Taken"
                    }
                  >
                    Bal
                  </ColHead>
                  {members.map((m) => {
                    const t = (taken.get(m.id) ?? emptyTaken())[cat];
                    const b = balanceMap.get(m.id) ?? emptyBalance(m.id, year);
                    const bal = available(b, cat) - t;
                    return (
                      <Row
                        key={m.id}
                        name={m.name}
                        ent={entitlement(b, cat)}
                        carry={extras ? carryForward(b, cat) : undefined}
                        lieu={extras ? inLieu(b, cat) : undefined}
                        taken={t}
                        bal={bal}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </aside>
  );
}

function ColHead({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div
      title={title}
      className="text-[10px] uppercase tracking-wider text-muted text-right tabular-nums"
    >
      {children}
    </div>
  );
}

function Row({
  name,
  ent,
  carry,
  lieu,
  taken,
  bal,
}: {
  name: string;
  ent: number;
  carry?: number;
  lieu?: number;
  taken: number;
  bal: number;
}) {
  return (
    <>
      <div className="truncate text-ink/90" title={name}>
        {name}
      </div>
      <Cell value={ent} />
      {carry !== undefined && <Cell value={carry} />}
      {lieu !== undefined && <Cell value={lieu} />}
      <Cell value={taken} />
      <div
        className={`text-right tabular-nums font-medium ${
          bal < 0 ? "text-red-600" : "text-ink"
        }`}
      >
        {fmt(bal)}
      </div>
    </>
  );
}

function Cell({ value }: { value: number }) {
  return <div className="text-right tabular-nums text-ink/80">{fmt(value)}</div>;
}
