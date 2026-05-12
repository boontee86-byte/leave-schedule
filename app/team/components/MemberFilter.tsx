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
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
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

  async function commitOrder(newOrder: string[]) {
    setBusy(true);
    try {
      const res = await fetch("/api/members/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: newOrder }),
      });
      if (res.ok) onReload();
    } finally {
      setBusy(false);
    }
  }

  function onDrop(targetId: string) {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const ids = members.map((m) => m.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, sourceId);
    commitOrder(ids);
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
          {members.map((m) => {
            const checked = selectedSet.has(m.id);
            const isDragging = dragId === m.id;
            const isOver = overId === m.id && dragId !== null && dragId !== m.id;
            return (
              <div
                key={m.id}
                draggable={!busy}
                onDragStart={(e) => {
                  setDragId(m.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", m.id);
                }}
                onDragEnter={() => {
                  if (dragId && dragId !== m.id) setOverId(m.id);
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={() => {
                  setOverId((cur) => (cur === m.id ? null : cur));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(m.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={`flex items-center gap-2 text-sm rounded-lg pl-2 pr-3 py-1.5 hover:bg-canvas transition-colors ${
                  checked ? "bg-canvas/70" : ""
                } ${isDragging ? "opacity-40" : ""} ${
                  isOver ? "ring-2 ring-ink/40 bg-canvas" : ""
                }`}
              >
                <span
                  className="text-muted select-none leading-none cursor-grab active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-hidden
                >
                  ⋮⋮
                </span>
                <label className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer" title={m.name}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 accent-ink"
                  />
                  <span className="truncate">{m.name}</span>
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
