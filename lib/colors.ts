export const LEAVE_TYPES = [
  "full_day",
  "full_day_block",
  "half_day_am",
  "half_day_pm",
  "medical",
  "medical_am",
  "medical_pm",
  "childcare",
  "childcare_am",
  "childcare_pm",
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

const ANNUAL_COLOR = "#C8DCC2";
const BLOCK_COLOR = "#7FA877";
const MEDICAL_COLOR = "#EAC4C9";
const CHILDCARE_COLOR = "#D9CFE6";

export const LEAVE_META: Record<
  LeaveType,
  { label: string; short: string; color: string; textColor: string }
> = {
  full_day:       { label: "Full day",                 short: "FD", color: ANNUAL_COLOR,    textColor: "#2F4A2C" },
  full_day_block: { label: "Full day (Block Leave)",   short: "BL", color: BLOCK_COLOR,     textColor: "#1F3A1D" },
  half_day_am:    { label: "Half day (AM)",            short: "AM", color: ANNUAL_COLOR,    textColor: "#2F4A2C" },
  half_day_pm:    { label: "Half day (PM)",            short: "PM", color: ANNUAL_COLOR,    textColor: "#2F4A2C" },
  medical:        { label: "Medical leave",            short: "M",  color: MEDICAL_COLOR,   textColor: "#5A2A35" },
  medical_am:     { label: "Medical leave (AM)",       short: "MA", color: MEDICAL_COLOR,   textColor: "#5A2A35" },
  medical_pm:     { label: "Medical leave (PM)",       short: "MP", color: MEDICAL_COLOR,   textColor: "#5A2A35" },
  childcare:      { label: "Family / Childcare Leave", short: "FC", color: CHILDCARE_COLOR, textColor: "#3E2F58" },
  childcare_am:   { label: "Family / Childcare (AM)",  short: "CA", color: CHILDCARE_COLOR, textColor: "#3E2F58" },
  childcare_pm:   { label: "Family / Childcare (PM)",  short: "CP", color: CHILDCARE_COLOR, textColor: "#3E2F58" },
};

export const AM_TYPES: ReadonlySet<LeaveType> = new Set([
  "half_day_am",
  "medical_am",
  "childcare_am",
]);
export const PM_TYPES: ReadonlySet<LeaveType> = new Set([
  "half_day_pm",
  "medical_pm",
  "childcare_pm",
]);

export type LeaveCategory = "annual" | "medical" | "childcare" | "block";
export type LeavePeriod = "full" | "am" | "pm";

export function categoryAndPeriod(t: LeaveType): { category: LeaveCategory; period: LeavePeriod } {
  switch (t) {
    case "full_day":       return { category: "annual",    period: "full" };
    case "half_day_am":    return { category: "annual",    period: "am" };
    case "half_day_pm":    return { category: "annual",    period: "pm" };
    case "full_day_block": return { category: "block",     period: "full" };
    case "medical":        return { category: "medical",   period: "full" };
    case "medical_am":     return { category: "medical",   period: "am" };
    case "medical_pm":     return { category: "medical",   period: "pm" };
    case "childcare":      return { category: "childcare", period: "full" };
    case "childcare_am":   return { category: "childcare", period: "am" };
    case "childcare_pm":   return { category: "childcare", period: "pm" };
  }
}

export function toLeaveType(category: LeaveCategory, period: LeavePeriod): LeaveType {
  if (category === "block") return "full_day_block";
  if (category === "annual") {
    if (period === "am") return "half_day_am";
    if (period === "pm") return "half_day_pm";
    return "full_day";
  }
  if (category === "medical") {
    if (period === "am") return "medical_am";
    if (period === "pm") return "medical_pm";
    return "medical";
  }
  if (period === "am") return "childcare_am";
  if (period === "pm") return "childcare_pm";
  return "childcare";
}

export const PUBLIC_HOLIDAY_COLOR = "#F2C79A";
export const WEEKEND_COLOR = "#c8ccd1";

export const IMPORTANT_COLORS = [
  { key: "amber",  hex: "#F5DDA2" },
  { key: "rose",   hex: "#EAC4C9" },
  { key: "sage",   hex: "#C8DCC2" },
  { key: "sky",    hex: "#C9DCEA" },
] as const;

export type ImportantColorKey = (typeof IMPORTANT_COLORS)[number]["key"];

export const importantHex = (key: string) =>
  IMPORTANT_COLORS.find((c) => c.key === key)?.hex ?? IMPORTANT_COLORS[0].hex;
