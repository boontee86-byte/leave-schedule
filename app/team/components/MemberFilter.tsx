"use client";

import { useEffect, useRef, useState } from "react";
import type { Member } from "./types";

type Props = {
  members: Member[];
  value: string[];
  onChange: (memberIds: string[]) => void;
};

export default function MemberFilter({ members, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
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
        <div className="absolute right-0 mt-1 z-40 w-60 rounded-xl2 border border-line bg-white shadow-soft p-1 max-h-[60vh] overflow-y-auto">
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
          {members.map((m) => {
            const checked = selectedSet.has(m.id);
            return (
              <label
                key={m.id}
                className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 cursor-pointer hover:bg-canvas ${
                  checked ? "bg-canvas/70" : ""
                }`}
                title={m.name}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(m.id)}
                  className="h-4 w-4 accent-ink"
                />
                <span className="truncate">{m.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
