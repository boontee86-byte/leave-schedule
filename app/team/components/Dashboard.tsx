"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addYears, startOfYear, endOfYear } from "date-fns";
import { fromISO, toISO } from "@/lib/dates";
import { LEAVE_META } from "@/lib/colors";
import type { LeaveEntry, Member, ImportantDate, Range, TeamData } from "./types";
import Grid from "./Grid";
import Legend from "./Legend";
import MemberSummary from "./MemberSummary";
import LeaveModal from "./LeaveModal";
import MemberDialog from "./MemberDialog";
import ImportantDateDialog from "./ImportantDateDialog";
import YearPicker from "./YearPicker";

type Props = {
  initialTeam: { id: string; name: string };
  initialRange: Range;
};

export type LeaveModalState =
  | { mode: "create"; member_id?: string; date?: string }
  | { mode: "edit"; entry: LeaveEntry };

export default function Dashboard({ initialTeam, initialRange }: Props) {
  const router = useRouter();
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaveModal, setLeaveModal] = useState<LeaveModalState | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [importantOpen, setImportantOpen] = useState<{ date?: string } | null>(null);

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

  return (
    <div className="min-h-screen bg-canvas text-ink">
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
            <button
              onClick={() => setLeaveModal({ mode: "create" })}
              className="rounded-full bg-ink text-white text-sm px-4 py-2 hover:opacity-90"
            >
              Log leave
            </button>
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
        <div className="grid lg:grid-cols-[1fr_240px] gap-5">
          <section>
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
                members={members}
                entries={entries}
                important={important}
                onCellClick={(member_id, date) =>
                  setLeaveModal({ mode: "create", member_id, date })
                }
                onEntryClick={(entry) => setLeaveModal({ mode: "edit", entry })}
                onDateLabelClick={(date) => setImportantOpen({ date })}
              />
            )}
          </section>

          <div className="lg:sticky lg:top-[88px] space-y-4 h-fit">
            <Legend entries={entries} range={range} />
            <MemberSummary members={members} entries={entries} />
          </div>
        </div>
      </main>

      {leaveModal && (
        <LeaveModal
          state={leaveModal}
          members={members}
          onClose={() => setLeaveModal(null)}
          onSaved={() => {
            setLeaveModal(null);
            reload();
          }}
        />
      )}
      {memberDialogOpen && (
        <MemberDialog
          members={members}
          onClose={() => setMemberDialogOpen(false)}
          onChanged={() => reload()}
        />
      )}
      {importantOpen && (
        <ImportantDateDialog
          presetDate={importantOpen.date}
          existing={important}
          onClose={() => setImportantOpen(null)}
          onChanged={() => reload()}
        />
      )}
    </div>
  );
}
