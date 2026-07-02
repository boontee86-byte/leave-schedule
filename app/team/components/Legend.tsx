"use client";

import {
  AM_TYPES,
  LEAVE_META,
  PM_TYPES,
  type LeaveType,
} from "@/lib/colors";

export type PaintMode =
  | { kind: "paint"; leave_type: LeaveType }
  | { kind: "erase" }
  | null;

type CategoryGroup = {
  key: string;
  label: string;
  full: LeaveType;
  am?: LeaveType;
  pm?: LeaveType;
};

const CHIP_GROUPS: CategoryGroup[] = [
  { key: "annual",    label: "Annual",    full: "full_day",       am: "half_day_am",  pm: "half_day_pm" },
  { key: "medical",   label: "Medical",   full: "medical",        am: "medical_am",   pm: "medical_pm" },
  { key: "childcare", label: "Family/Childcare", full: "childcare",      am: "childcare_am", pm: "childcare_pm" },
  { key: "parental",         label: "Parental",         full: "parental",         am: "parental_am",         pm: "parental_pm" },
  { key: "hospitalisation",  label: "Hospitalisation",  full: "hospitalisation",  am: "hospitalisation_am",  pm: "hospitalisation_pm" },
  { key: "compassionate",    label: "Compassionate",    full: "compassionate",    am: "compassionate_am",    pm: "compassionate_pm" },
  { key: "national_service", label: "National Service", full: "national_service", am: "national_service_am", pm: "national_service_pm" },
  { key: "marriage",         label: "Marriage",         full: "marriage",         am: "marriage_am",         pm: "marriage_pm" },
  { key: "exam_study",       label: "Exam/Study",       full: "exam_study",       am: "exam_study_am",       pm: "exam_study_pm" },
  { key: "block",     label: "Mandatory", full: "full_day_block" },
];

const EMPTY_BG = "#ebedf0";

function chipFillStyle(type: LeaveType): React.CSSProperties {
  const color = LEAVE_META[type].color;
  if (AM_TYPES.has(type)) {
    return { background: `linear-gradient(to right, ${color} 50%, ${EMPTY_BG} 50%)` };
  }
  if (PM_TYPES.has(type)) {
    return { background: `linear-gradient(to right, ${EMPTY_BG} 50%, ${color} 50%)` };
  }
  return { backgroundColor: color };
}

type LeavePaletteProps = {
  paintMode: PaintMode;
  onSetPaintMode: (m: PaintMode) => void;
  className?: string;
};

export function LeavePalette({
  paintMode,
  onSetPaintMode,
  className,
}: LeavePaletteProps) {
  function toggleChip(type: LeaveType) {
    if (paintMode?.kind === "paint" && paintMode.leave_type === type) {
      onSetPaintMode(null);
    } else {
      onSetPaintMode({ kind: "paint", leave_type: type });
    }
  }

  function toggleEraser() {
    if (paintMode?.kind === "erase") onSetPaintMode(null);
    else onSetPaintMode({ kind: "erase" });
  }

  const isActive = (type: LeaveType) =>
    paintMode?.kind === "paint" && paintMode.leave_type === type;
  const isEraserActive = paintMode?.kind === "erase";

  return (
    <aside
      data-legend-root
      className={`rounded-xl2 border border-line bg-white shadow-soft p-2${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {CHIP_GROUPS.map((g) => (
          <div key={g.key} className="flex items-center gap-1.5 text-[12px]">
            <span className="text-ink/75 whitespace-nowrap">{g.label}</span>
            <div className="flex shrink-0 gap-1">
              <ChipButton
                type={g.full}
                label="Full"
                active={isActive(g.full)}
                onClick={() => toggleChip(g.full)}
              />
              {g.am && (
                <ChipButton
                  type={g.am}
                  label="AM"
                  active={isActive(g.am)}
                  onClick={() => toggleChip(g.am!)}
                />
              )}
              {g.pm && (
                <ChipButton
                  type={g.pm}
                  label="PM"
                  active={isActive(g.pm)}
                  onClick={() => toggleChip(g.pm!)}
                />
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-ink/75 whitespace-nowrap">Eraser</span>
          <button
            type="button"
            onClick={toggleEraser}
            title="Erase leave on click/drag"
            aria-pressed={isEraserActive}
            className={`inline-flex items-center justify-center h-[22px] min-w-[34px] px-1 rounded border text-[13px] leading-none transition ${
              isEraserActive
                ? "ring-2 ring-ink/60 ring-offset-1 border-ink/40 bg-canvas"
                : "border-line bg-white hover:bg-canvas"
            }`}
          >
            <span aria-hidden>🧽</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function ChipButton({
  type,
  label,
  active,
  onClick,
}: {
  type: LeaveType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const fill = chipFillStyle(type);
  const meta = LEAVE_META[type];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={meta.label}
      className={`inline-flex items-center justify-center h-[22px] min-w-[34px] px-1 rounded border text-[10px] font-medium leading-none transition ${
        active
          ? "ring-2 ring-ink/60 ring-offset-1 border-ink/40"
          : "border-line hover:ring-1 hover:ring-ink/20"
      }`}
      style={fill}
    >
      <span className="text-ink/80 mix-blend-multiply">{label}</span>
    </button>
  );
}
