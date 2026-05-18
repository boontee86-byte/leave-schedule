"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addYears, startOfYear, endOfYear } from "date-fns";
import { expandRange, fromISO, isWeekend, toISO } from "@/lib/dates";
import { LEAVE_META } from "@/lib/colors";
import { isPublicHoliday } from "@/lib/holidays";
import type {
  LeaveEntry,
  Member,
  MemberBalance,
  ImportantDate,
  Range,
  TeamData,
} from "./types";
import Grid from "./Grid";
import Legend, { type PaintMode } from "./Legend";
import MemberSummary from "./MemberSummary";
import MemberDialog from "./MemberDialog";
import ImportantDateDialog from "./ImportantDateDialog";
import BalanceDialog from "./BalanceDialog";
import YearPicker from "./YearPicker";
import MemberFilter from "./MemberFilter";

type Props = {
  initialTeam: { id: string; name: string };
  initialRange: Range;
};

export default function Dashboard({ initialTeam, initialRange }: Props) {
  const router = useRouter();
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paintMode, setPaintMode] = useState<PaintMode>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [importantOpen, setImportantOpen] = useState<
    { date?: string; editing?: ImportantDate } | null
  >(null);
  const [memberFilter, setMemberFilter] = useState<string[]>([]);

  const reload = useCallback(
    async (r: Range = range) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/team/data?from=${r.from}&to=${r.to}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.push("/");
          return;
        }
        const json = (await res.json()) as TeamData;
        setData(json);
      } finally {
        setLoading(false);
      }
    },
    [range, router],
  );

  useEffect(() => {
    reload(range);
  }, [range, reload]);

  // Exit paint mode on Escape or click outside the legend & grid.
  useEffect(() => {
    if (!paintMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPaintMode(null);
    }
    function onPointerDown(e: PointerEvent) {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-legend-root]")) return;
      if (t.closest("[data-paint-cell]")) return;
      setPaintMode(null);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [paintMode]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function shiftYears(delta: number) {
    const anchor = addYears(fromISO(range.from), delta);
    setRange({ from: toISO(startOfYear(anchor)), to: toISO(endOfYear(anchor)) });
  }

  const members = useMemo<Member[]>(() => data?.members ?? [], [data]);
  const entries = useMemo<LeaveEntry[]>(
    () => (data?.leave_entries ?? []).filter((e) => e.leave_type in LEAVE_META),
    [data],
  );
  const important = useMemo<ImportantDate[]>(() => data?.important_dates ?? [], [data]);
  const balances = useMemo<MemberBalance[]>(() => data?.balances ?? [], [data]);
  const year = useMemo(
    () => data?.year ?? fromISO(range.from).getFullYear(),
    [data, range.from],
  );

  useEffect(() => {
    if (memberFilter.length === 0) return;
    const valid = new Set(members.map((m) => m.id));
    const filtered = memberFilter.filter((id) => valid.has(id));
    if (filtered.length !== memberFilter.length) setMemberFilter(filtered);
  }, [members, memberFilter]);

  const visibleMembers = useMemo<Member[]>(() => {
    if (memberFilter.length === 0) return members;
    const set = new Set(memberFilter);
    return members.filter((m) => set.has(m.id));
  }, [members, memberFilter]);

  const onPaint = useCallback(
    (memberId: string, from: string, to: string, mode: NonNullable<PaintMode>) => {
      // 1. Optimistic local update.
      setData((d) => {
        if (!d) return d;
        const stripped = d.leave_entries.filter(
          (e) => !(e.member_id === memberId && e.date >= from && e.date <= to),
        );
        if (mode.kind === "erase") {
          return { ...d, leave_entries: stripped };
        }
        const synthesized: LeaveEntry[] = [];
        for (const day of expandRange(from, to)) {
          if (isWeekend(day)) continue;
          const iso = toISO(day);
          if (isPublicHoliday(iso)) continue;
          synthesized.push({
            id: `temp:${memberId}:${iso}:${Math.random().toString(36).slice(2, 8)}`,
            member_id: memberId,
            date: iso,
            leave_type: mode.leave_type,
            notes: null,
          });
        }
        return { ...d, leave_entries: [...stripped, ...synthesized] };
      });

      // 2. Fire network call. Only reload on error — the optimistic state is
      //    already correct on success, so skipping the refetch removes the
      //    post-paint "settling" tail.
      void (async () => {
        try {
          const res =
            mode.kind === "paint"
              ? await fetch("/api/leave", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    member_id: memberId,
                    from,
                    to,
                    leave_type: mode.leave_type,
                  }),
                })
              : await fetch(
                  `/api/leave?${new URLSearchParams({
                    member_id: memberId,
                    from,
                    to,
                  }).toString()}`,
                  { method: "DELETE" },
                );
          if (!res.ok) reload();
        } catch {
          reload();
        }
      })();
    },
    [reload],
  );

  return (
    <div
      className={`min-h-screen bg-canvas text-ink ${
        paintMode ? "cursor-crosshair" : ""
      }`}
    >
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-full bg-leave-full/70" aria-hidden />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted">Team</div>
                <h1 className="text-lg font-medium leading-tight truncate">{initialTeam.name}</h1>
              </div>
            </div>
            <button
              onClick={logout}
              className="sm:hidden rounded-full border border-line bg-white text-sm px-3 py-2 text-muted hover:bg-canvas shrink-0"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <YearPicker
              year={fromISO(range.from).getFullYear()}
              onShiftYears={shiftYears}
            />
            <MemberFilter
              members={members}
              value={memberFilter}
              onChange={setMemberFilter}
              onReload={() => reload()}
            />
            <button
              onClick={() => setImportantOpen({})}
              className="rounded-full border border-line bg-white text-sm px-4 py-2 hover:bg-canvas"
            >
              Important date
            </button>
            <button
              onClick={() => setMemberDialogOpen(true)}
              className="rounded-full border border-line bg-white text-sm px-4 py-2 hover:bg-canvas"
            >
              Members
            </button>
            <button
              onClick={() => setBalanceDialogOpen(true)}
              className="rounded-full border border-line bg-white text-sm px-4 py-2 hover:bg-canvas"
            >
              Balances
            </button>
            <button
              onClick={logout}
              className="hidden sm:inline-flex rounded-full border border-line bg-white text-sm px-3 py-2 text-muted hover:bg-canvas"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-5">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          <section className="min-w-0">
            {loading && !data ? (
              <div className="rounded-xl2 border border-line bg-white shadow-soft p-10 text-center text-muted text-sm">
                Loading schedule…
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-xl2 border border-line bg-white shadow-soft p-10 text-center">
                <p className="text-sm text-muted mb-3">
                  No team members yet. Add the first one to start logging leave.
                </p>
                <button
                  onClick={() => setMemberDialogOpen(true)}
                  className="rounded-full bg-ink text-white text-sm px-4 py-2"
                >
                  Add member
                </button>
              </div>
            ) : (
              <Grid
                range={range}
                members={visibleMembers}
                entries={entries}
                important={important}
                paintMode={paintMode}
                onPaint={onPaint}
                onDateLabelClick={(date) => setImportantOpen({ date })}
              />
            )}
          </section>

          <div className="lg:sticky lg:top-[88px] space-y-4 h-fit max-w-sm lg:max-w-none">
            <Legend
              range={range}
              important={important}
              paintMode={paintMode}
              onSetPaintMode={setPaintMode}
              onEditImportant={(d) => setImportantOpen({ editing: d })}
              onReload={() => reload()}
            />
            <MemberSummary
              members={visibleMembers}
              entries={entries}
              balances={balances}
              year={year}
            />
          </div>
        </div>
      </main>

      {memberDialogOpen && (
        <MemberDialog
          members={members}
          onClose={() => setMemberDialogOpen(false)}
          onChanged={() => reload()}
        />
      )}
      {balanceDialogOpen && (
        <BalanceDialog
          members={members}
          balances={balances}
          year={year}
          onClose={() => setBalanceDialogOpen(false)}
          onChanged={() => reload()}
        />
      )}
      {importantOpen && (
        <ImportantDateDialog
          presetDate={importantOpen.date}
          editing={importantOpen.editing}
          existing={important}
          onClose={() => setImportantOpen(null)}
          onChanged={() => reload()}
        />
      )}
    </div>
  );
}
