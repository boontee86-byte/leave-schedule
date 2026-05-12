"use client";

import { useEffect, useRef, useState } from "react";
import type { Member } from "./types";

type Props = {
  members: Member[];
  value: string[];
  onChange: (memberIds: string[]) => void;
  onReload: () => void;
};

export default function MemberFilter({ members, value, onChange, onReload }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const selectedSet = new Set(value);
  const allSelected = value.length === 0;
  let label: string;
  if (allSelected) {
    label = "All members";
  } else if (value.length === 1) {
    label = members.find((m) => m.id === value[0])?.name ?? "1 member";
  } else {
    label = `${value.length} members`;
  }

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= members.length) return;
    const order = members.map((m) => m.id);
    [order[index], order[target]] = [order[target], order[index]];
    setBusy(true);
    try {
      const res = await fetch("/api/members/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: order }),
      });
      if (res.ok) onReload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-line bg-white text-sm h-9 px-3 flex items-center gap-2 hover:bg-canvas max-w-[200px]"
        title={label}
      >
        <span className="truncate">View: {label}</span>
        <span className="text-muted">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-40 w-72 rounded-xl2 border border-line bg-white shadow-soft p-1 max-h-[60vh] overflow-y-auto">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full text-left text-sm rounded-lg px-3 py-2 hover:bg-canvas ${
              allSelected ? "bg-canvas/70 font-medium" : ""
            }`}
          >
            All members
          </button>
          <div className="my-1 border-t border-line" />
          {members.map((m, i) => {
            const checked = selectedSet.has(m.id);
            const isFirst = i === 0;
            const isLast = i === members.length - 1;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-1 text-sm rounded-lg pl-3 pr-1 py-1.5 hover:bg-canvas ${
                  checked ? "bg-canvas/70" : ""
                }`}
              >
                <label className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer" title={m.name}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 accent-ink"
                  />
                  <span className="truncate">{m.name}</span>
                </label>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={busy || isFirst}
                  title="Move up"
                  aria-label={`Move ${m.name} up`}
                  className="h-7 w-7 inline-flex items-center justify-center rounded text-muted hover:text-ink hover:bg-canvas disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={busy || isLast}
                  title="Move down"
                  aria-label={`Move ${m.name} down`}
                  className="h-7 w-7 inline-flex items-center justify-center rounded text-muted hover:text-ink hover:bg-canvas disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  ↓
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
