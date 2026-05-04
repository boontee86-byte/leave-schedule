"use client";

import { useEffect } from "react";

export default function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-xl2 border border-line shadow-soft w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h2 className="text-base font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="px-5 py-4 overflow-auto">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-line bg-canvas/40">{footer}</footer>}
      </div>
    </div>
  );
}
