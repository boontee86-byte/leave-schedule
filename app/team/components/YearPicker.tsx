"use client";

type Props = {
  year: number;
  onShiftYears: (delta: number) => void;
};

export default function YearPicker({ year, onShiftYears }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onShiftYears(-1)}
        className="rounded-full border border-line bg-white text-sm h-9 w-9 hover:bg-canvas"
        aria-label="Previous year"
        type="button"
      >
        ‹
      </button>
      <div
        className="rounded-full border border-line bg-white text-sm px-4 h-9 flex items-center font-medium tabular-nums tracking-wide"
        title={`${year}`}
      >
        {year}
      </div>
      <button
        onClick={() => onShiftYears(1)}
        className="rounded-full border border-line bg-white text-sm h-9 w-9 hover:bg-canvas"
        aria-label="Next year"
        type="button"
      >
        ›
      </button>
    </div>
  );
}
