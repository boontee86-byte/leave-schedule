"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  emptyBalance,
  hasExtras,
  type Category,
} from "@/lib/balance";
import type { Member, MemberBalance } from "./types";
import Modal from "./Modal";

type Props = {
  members: Member[];
  balances: MemberBalance[];
  year: number;
  onClose: () => void;
  onChanged: () => void;
};

type FieldKey =
  | "entitlement_annual"
  | "entitlement_medical"
  | "entitlement_childcare"
  | "carry_forward_annual"
  | "in_lieu_annual";

export default function BalanceDialog({
  members,
  balances,
  year,
  onClose,
  onChanged,
}: Props) {
  const initial = useMemo(() => {
    const map = new Map<string, MemberBalance>();
    for (const m of members) map.set(m.id, emptyBalance(m.id, year));
    for (const b of balances) map.set(b.member_id, b);
    return map;
  }, [members, balances, year]);

  const [rows, setRows] = useState<Map<string, MemberBalance>>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(memberId: string, field: FieldKey, raw: string) {
    const num = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(num) || num < 0) return;
    setRows((prev) => {
      const next = new Map(prev);
      const current = next.get(memberId) ?? emptyBalance(memberId, year);
      next.set(memberId, { ...current, [field]: num });
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = {
        year,
        balances: members.map((m) => {
          const r = rows.get(m.id) ?? emptyBalance(m.id, year);
          const { year: _y, ...rest } = r;
          return rest;
        }),
      };
      const res = await fetch("/api/balances", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Leave balances · ${year}`}
      wide
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted">
            Annual balance = Ent + Brought fwd + In lieu − Taken. Medical / Family balance = Ent − Taken.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm rounded-full px-4 py-2 border border-line hover:bg-canvas"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || members.length === 0}
              className="text-sm rounded-full px-4 py-2 bg-ink text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      }
    >
      {members.length === 0 ? (
        <p className="text-sm text-muted">Add a team member before setting balances.</p>
      ) : (
        <form onSubmit={save} className="space-y-6">
          {CATEGORIES.map((cat) => (
            <CategorySection
              key={cat}
              cat={cat}
              members={members}
              rows={rows}
              year={year}
              onChange={setField}
            />
          ))}

          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2 border"
              style={{ backgroundColor: "#FBE4E8", borderColor: "#EAC4C9", color: "#5A2A35" }}
            >
              {error}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}

function CategorySection({
  cat,
  members,
  rows,
  year,
  onChange,
}: {
  cat: Category;
  members: Member[];
  rows: Map<string, MemberBalance>;
  year: number;
  onChange: (memberId: string, field: FieldKey, raw: string) => void;
}) {
  const extras = hasExtras(cat);
  const colCount = extras ? 3 : 1;
  return (
    <section>
      <h3 className="text-sm font-medium mb-2">{CATEGORY_LABEL[cat]}</h3>
      <div
        className="grid items-center gap-x-3 gap-y-1.5 text-sm"
        style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${colCount}, 88px)` }}
      >
        <div className="text-[10px] uppercase tracking-wider text-muted" />
        <Head>Entitlement</Head>
        {extras && <Head>Brought fwd</Head>}
        {extras && <Head>In lieu</Head>}
        {members.map((m) => {
          const r = rows.get(m.id) ?? emptyBalance(m.id, year);
          return (
            <RowInputs
              key={m.id}
              name={m.name}
              ent={r[`entitlement_${cat}`]}
              carry={extras ? r.carry_forward_annual : undefined}
              lieu={extras ? r.in_lieu_annual : undefined}
              onEnt={(v) => onChange(m.id, `entitlement_${cat}` as FieldKey, v)}
              onCarry={
                extras ? (v) => onChange(m.id, "carry_forward_annual", v) : undefined
              }
              onLieu={
                extras ? (v) => onChange(m.id, "in_lieu_annual", v) : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted text-right">
      {children}
    </div>
  );
}

function RowInputs({
  name,
  ent,
  carry,
  lieu,
  onEnt,
  onCarry,
  onLieu,
}: {
  name: string;
  ent: number;
  carry?: number;
  lieu?: number;
  onEnt: (raw: string) => void;
  onCarry?: (raw: string) => void;
  onLieu?: (raw: string) => void;
}) {
  return (
    <>
      <div className="truncate text-ink/90" title={name}>
        {name}
      </div>
      <NumInput value={ent} onChange={onEnt} />
      {onCarry !== undefined && <NumInput value={carry ?? 0} onChange={onCarry} />}
      {onLieu !== undefined && <NumInput value={lieu ?? 0} onChange={onLieu} />}
    </>
  );
}

function NumInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (raw: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      max={365}
      step={0.5}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-right tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-leave-full"
    />
  );
}
