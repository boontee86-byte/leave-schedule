"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { fromISO, toISO } from "@/lib/dates";
import type { Range } from "./types";

type Props = {
  range: Range;
  onChange: (r: Range) => void;
  onShiftMonths: (delta: number) => void;
};

export default function RangePicker({ range, onChange, onShiftMonths }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [picked, setPicked] = useState<DateRange | undefined>({
    from: fromISO(range.from),
    to: fromISO(range.to),
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function apply() {
    if (picked?.from && picked?.to) {
      onChange({ from: toISO(picked.from), to: toISO(picked.to) });
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onShiftMonths(-1)}
          className="rounded-full border border-line bg-white text-sm h-9 w-9 hover:bg-canvas"
          aria-label="Previous month"
          type="button"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-line bg-white text-sm px-3 h-9 hover:bg-canvas tabular-nums"
        >
          {range.from} → {range.to}
        </button>
        <button
          onClick={() => onShiftMonths(1)}
          className="rounded-full border border-line bg-white text-sm h-9 w-9 hover:bg-canvas"
          aria-label="Next month"
          type="button"
        >
          ›
        </button>
      </div>
      {open && (
        <div className="absolute right-0 mt-2 z-40 rounded-xl2 border border-line bg-white shadow-soft p-3">
          <DayPicker
            mode="range"
            selected={picked}
            onSelect={setPicked}
            numberOfMonths={2}
            weekStartsOn={1}
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={() => setOpen(false)}
              className="text-sm rounded-full px-3 py-1.5 border border-line bg-white"
            >
              Cancel
            </button>
            <button
              onClick={apply}
              className="text-sm rounded-full px-3 py-1.5 bg-ink text-white"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
