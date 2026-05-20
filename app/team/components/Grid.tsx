"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { PaintMode } from "./Legend";
import type { LeaveEntry, ImportantDate, Member, Range } from "./types";

type Props = {
  range: Range;
  members: Member[];
  entries: LeaveEntry[];
  important: ImportantDate[];
  paintMode: PaintMode;
  onPaint: (memberId: string, fromISO: string, toISO: string, mode: NonNullable<PaintMode>) => void;
  onDateLabelClick: (date: string) => void;
};

type PreviewState = {
  memberId: string;
  from: string;
  to: string;
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
  paintMode,
  onPaint,
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

  const dragRef = useRef<{ memberId: string; startISO: string; currentISO: string } | null>(null);
  const longPressRef = useRef<{
    memberId: string;
    iso: string;
    startX: number;
    startY: number;
    pointerId: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const lastClickRef = useRef<{ memberId: string; iso: string } | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const paintModeRef = useRef(paintMode);
  useEffect(() => {
    paintModeRef.current = paintMode;
  }, [paintMode]);

  const clearLongPress = useCallback(() => {
    const lp = longPressRef.current;
    if (lp) {
      clearTimeout(lp.timer);
      longPressRef.current = null;
    }
  }, []);

  const commitDrag = useCallback(() => {
    const drag = dragRef.current;
    const mode = paintModeRef.current;
    dragRef.current = null;
    setPreview(null);
    if (!drag || !mode) return;
    const from = drag.startISO < drag.currentISO ? drag.startISO : drag.currentISO;
    const to = drag.startISO < drag.currentISO ? drag.currentISO : drag.startISO;
    onPaint(drag.memberId, from, to, mode);
    lastClickRef.current = { memberId: drag.memberId, iso: drag.currentISO };
  }, [onPaint]);

  useEffect(() => {
    function onPointerUp() {
      if (dragRef.current) commitDrag();
    }
    function onPointerCancel() {
      clearLongPress();
      dragRef.current = null;
      setPreview(null);
    }
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [commitDrag, clearLongPress]);

  // Cancel any in-flight drag/long-press if paint mode is cleared (e.g., user pressed Esc).
  useEffect(() => {
    if (paintMode === null) {
      clearLongPress();
      if (dragRef.current) {
        dragRef.current = null;
        setPreview(null);
      }
    }
  }, [paintMode, clearLongPress]);

  const handleCellPointerDown = useCallback(
    (memberId: string, iso: string, e: React.PointerEvent) => {
      const mode = paintModeRef.current;
      if (!mode) return;
      // Suppress browser native drag/selection so paint feels native.
      e.preventDefault();

      // Shift+click range from last click on the same row (mouse only).
      if (
        e.pointerType === "mouse" &&
        e.shiftKey &&
        lastClickRef.current?.memberId === memberId
      ) {
        const anchor = lastClickRef.current.iso;
        const from = anchor < iso ? anchor : iso;
        const to = anchor < iso ? iso : anchor;
        onPaint(memberId, from, to, mode);
        lastClickRef.current = { memberId, iso };
        return;
      }

      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        // setPointerCapture can throw if the element is already released — ignore.
      }

      if (e.pointerType === "mouse") {
        // Desktop: drag starts immediately.
        dragRef.current = { memberId, startISO: iso, currentISO: iso };
        setPreview({ memberId, from: iso, to: iso });
        return;
      }

      // Touch / pen: long-press to enter drag mode; short tap paints a single cell.
      clearLongPress();
      const pointerId = e.pointerId;
      const startX = e.clientX;
      const startY = e.clientY;
      const timer = setTimeout(() => {
        const lp = longPressRef.current;
        if (!lp || lp.pointerId !== pointerId) return;
        longPressRef.current = null;
        dragRef.current = { memberId, startISO: iso, currentISO: iso };
        setPreview({ memberId, from: iso, to: iso });
        try {
          navigator.vibrate?.(15);
        } catch {
          // vibrate may be unavailable or rejected — ignore.
        }
      }, 400);
      longPressRef.current = { memberId, iso, startX, startY, pointerId, timer };
    },
    [onPaint, clearLongPress],
  );

  const handleCellPointerMove = useCallback((e: React.PointerEvent) => {
    // Long-press pending: cancel if the finger drifts before the timer fires.
    const lp = longPressRef.current;
    if (lp && lp.pointerId === e.pointerId) {
      if (Math.abs(e.clientX - lp.startX) + Math.abs(e.clientY - lp.startY) > 6) {
        clearTimeout(lp.timer);
        longPressRef.current = null;
      }
      return;
    }

    // Active drag: hit-test the cell under the pointer (works across month sections).
    const drag = dragRef.current;
    if (!drag) return;
    const hit = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-day-iso][data-member-id]") as HTMLElement | null;
    if (!hit) return;
    const targetMember = hit.dataset.memberId;
    const targetISO = hit.dataset.dayIso;
    if (!targetMember || !targetISO) return;
    if (targetMember !== drag.memberId) return;
    if (drag.currentISO === targetISO) return;
    drag.currentISO = targetISO;
    const from = drag.startISO < targetISO ? drag.startISO : targetISO;
    const to = drag.startISO < targetISO ? targetISO : drag.startISO;
    setPreview({ memberId: drag.memberId, from, to });
  }, []);

  const handleCellPointerUp = useCallback(
    (memberId: string, iso: string, e: React.PointerEvent) => {
      const lp = longPressRef.current;
      if (lp && lp.pointerId === e.pointerId) {
        // Tap completed before the long-press timer fired — paint the single cell.
        clearTimeout(lp.timer);
        longPressRef.current = null;
        const mode = paintModeRef.current;
        if (mode) {
          onPaint(memberId, iso, iso, mode);
          lastClickRef.current = { memberId, iso };
        }
      }
      // Active-drag commit is handled by the window pointerup listener.
    },
    [onPaint],
  );

  const interactive = paintMode !== null;
  const todayISO = useMemo(() => toISO(new Date()), []);

  return (
    <div className="flex flex-col gap-7 min-w-0">
      {months.map((m) => (
        <MonthGrid
          key={m.label}
          label={m.label}
          days={m.days}
          members={members}
          byCell={byCell}
          byDate={byDate}
          paintMode={paintMode}
          preview={preview}
          interactive={interactive}
          todayISO={todayISO}
          onCellPointerDown={handleCellPointerDown}
          onCellPointerMove={handleCellPointerMove}
          onCellPointerUp={handleCellPointerUp}
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
  paintMode,
  preview,
  interactive,
  todayISO,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
  onDateLabelClick,
}: {
  label: string;
  days: Date[];
  members: Member[];
  byCell: Map<string, LeaveEntry[]>;
  byDate: Map<string, ImportantDate[]>;
  paintMode: PaintMode;
  preview: PreviewState | null;
  interactive: boolean;
  todayISO: string;
  onCellPointerDown: (memberId: string, iso: string, e: React.PointerEvent) => void;
  onCellPointerMove: (e: React.PointerEvent) => void;
  onCellPointerUp: (memberId: string, iso: string, e: React.PointerEvent) => void;
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
            const isToday = iso === todayISO;
            const labels: string[] = [];
            if (isToday) labels.push("Today");
            if (ph) labels.push(`Public holiday — ${ph.label}`);
            if (imp && imp.length > 0) {
              for (const i of imp) labels.push(`${i.label}${i.notes ? ` — ${i.notes}` : ""}`);
            }
            const tooltip = labels.length > 0 ? labels.join("\n") : "Click to mark as important";
            const showAccent = isToday || accent || ph;
            const accentBg = isToday
              ? undefined
              : accent
                ? importantHex(accent.color_key)
                : PUBLIC_HOLIDAY_COLOR;
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
                    className={`inline-flex items-center justify-center rounded-full font-semibold ${
                      isToday ? "bg-ink text-white" : "text-ink"
                    }`}
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
              paintMode={paintMode}
              preview={preview?.memberId === m.id ? preview : null}
              interactive={interactive}
              onCellPointerDown={onCellPointerDown}
              onCellPointerMove={onCellPointerMove}
              onCellPointerUp={onCellPointerUp}
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
  paintMode,
  preview,
  interactive,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
}: {
  member: Member;
  days: Date[];
  byCell: Map<string, LeaveEntry[]>;
  paintMode: PaintMode;
  preview: PreviewState | null;
  interactive: boolean;
  onCellPointerDown: (memberId: string, iso: string, e: React.PointerEvent) => void;
  onCellPointerMove: (e: React.PointerEvent) => void;
  onCellPointerUp: (memberId: string, iso: string, e: React.PointerEvent) => void;
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
        const inPreview =
          !!preview && iso >= preview.from && iso <= preview.to;
        return (
          <DayCell
            key={member.id + iso}
            memberId={member.id}
            iso={iso}
            weekend={isWeekend(d)}
            holidayLabel={ph?.label}
            entries={cellEntries}
            paintMode={paintMode}
            inPreview={inPreview}
            interactive={interactive}
            onCellPointerDown={onCellPointerDown}
            onCellPointerMove={onCellPointerMove}
            onCellPointerUp={onCellPointerUp}
          />
        );
      })}
    </>
  );
}

const DayCell = memo(function DayCell({
  memberId,
  iso,
  weekend,
  holidayLabel,
  entries,
  paintMode,
  inPreview,
  interactive,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
}: {
  memberId: string;
  iso: string;
  weekend: boolean;
  holidayLabel?: string;
  entries: LeaveEntry[];
  paintMode: PaintMode;
  inPreview: boolean;
  interactive: boolean;
  onCellPointerDown: (memberId: string, iso: string, e: React.PointerEvent) => void;
  onCellPointerMove: (e: React.PointerEvent) => void;
  onCellPointerUp: (memberId: string, iso: string, e: React.PointerEvent) => void;
}) {
  const baseStyle: React.CSSProperties = {
    width: CELL,
    height: CELL,
    borderRadius: 3,
  };

  if (weekend) {
    return (
      <div
        data-paint-cell=""
        style={{ ...baseStyle, backgroundColor: WEEKEND_COLOR }}
        title="Weekend"
        aria-label="Weekend"
      />
    );
  }

  if (holidayLabel) {
    return (
      <div
        data-paint-cell=""
        style={{ ...baseStyle, backgroundColor: PUBLIC_HOLIDAY_COLOR }}
        title={`Public holiday — ${holidayLabel}`}
        aria-label={`Public holiday — ${holidayLabel}`}
      />
    );
  }

  const empty = entries.length === 0;
  const fill = empty
    ? { backgroundColor: EMPTY_BG }
    : renderFill(entries, EMPTY_BG);

  const tooltip = empty
    ? undefined
    : entries
        .map((e) => {
          const meta = LEAVE_META[e.leave_type];
          return `${meta.label}${e.notes ? ` — ${e.notes}` : ""}`;
        })
        .join(" · ");

  const previewOverlay = inPreview ? previewStyleFor(paintMode) : null;

  return (
    <div
      data-paint-cell=""
      data-member-id={memberId}
      data-day-iso={iso}
      onPointerDown={
        interactive
          ? (e) => onCellPointerDown(memberId, iso, e)
          : undefined
      }
      onPointerMove={interactive ? onCellPointerMove : undefined}
      onPointerUp={
        interactive ? (e) => onCellPointerUp(memberId, iso, e) : undefined
      }
      title={tooltip}
      aria-label={empty ? `Empty day ${iso}` : tooltip}
      style={{
        ...baseStyle,
        ...fill,
        ...(previewOverlay ?? {}),
        cursor: interactive ? "crosshair" : "default",
        touchAction: interactive ? "none" : undefined,
      }}
      className={
        interactive
          ? "hover:ring-2 hover:ring-ink/30 transition"
          : ""
      }
    />
  );
});

function previewStyleFor(mode: PaintMode): React.CSSProperties {
  if (!mode) return {};
  if (mode.kind === "erase") {
    return {
      boxShadow: "inset 0 0 0 2px rgba(220,60,60,0.85)",
      backgroundImage:
        "repeating-linear-gradient(45deg, rgba(220,60,60,0.25) 0 3px, transparent 3px 6px)",
    };
  }
  const color = LEAVE_META[mode.leave_type].color;
  return {
    boxShadow: `inset 0 0 0 2px ${color}`,
  };
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
