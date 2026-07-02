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
  "parental",
  "parental_am",
  "parental_pm",
  "hospitalisation",
  "hospitalisation_am",
  "hospitalisation_pm",
  "compassionate",
  "compassionate_am",
  "compassionate_pm",
  "national_service",
  "national_service_am",
  "national_service_pm",
  "marriage",
  "marriage_am",
  "marriage_pm",
  "exam_study",
  "exam_study_am",
  "exam_study_pm",
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

const ANNUAL_COLOR = "#C8DCC2";
const BLOCK_COLOR = "#7FA877";
const MEDICAL_COLOR = "#EAC4C9";
const CHILDCARE_COLOR = "#D9CFE6";
const PARENTAL_COLOR = "#AFCBE3";
const HOSPITALISATION_COLOR = "#A6D7CE";
const COMPASSIONATE_COLOR = "#C7C2BB";
const NATIONAL_SERVICE_COLOR = "#CBD19C";
const MARRIAGE_COLOR = "#F2E1A0";
const EXAM_STUDY_COLOR = "#E3C3A0";

export const LEAVE_META: Record<
  LeaveType,
  { label: string; short: string; color: string; textColor: string }
> = {
  full_day:       { label: "Full day",                 short: "FD", color: ANNUAL_COLOR,    textColor: "#2F4A2C" },
  full_day_block: { label: "Full day (Mandatory Leave)", short: "ML", color: BLOCK_COLOR,    textColor: "#1F3A1D" },
  half_day_am:    { label: "Half day (AM)",            short: "AM", color: ANNUAL_COLOR,    textColor: "#2F4A2C" },
  half_day_pm:    { label: "Half day (PM)",            short: "PM", color: ANNUAL_COLOR,    textColor: "#2F4A2C" },
  medical:        { label: "Medical leave",            short: "M",  color: MEDICAL_COLOR,   textColor: "#5A2A35" },
  medical_am:     { label: "Medical leave (AM)",       short: "MA", color: MEDICAL_COLOR,   textColor: "#5A2A35" },
  medical_pm:     { label: "Medical leave (PM)",       short: "MP", color: MEDICAL_COLOR,   textColor: "#5A2A35" },
  childcare:      { label: "Family / Childcare Leave", short: "FC", color: CHILDCARE_COLOR, textColor: "#3E2F58" },
  childcare_am:   { label: "Family / Childcare (AM)",  short: "CA", color: CHILDCARE_COLOR, textColor: "#3E2F58" },
  childcare_pm:   { label: "Family / Childcare (PM)",  short: "CP", color: CHILDCARE_COLOR, textColor: "#3E2F58" },
  parental:            { label: "Parental leave",            short: "PL",  color: PARENTAL_COLOR,         textColor: "#1F3A52" },
  parental_am:         { label: "Parental leave (AM)",       short: "PLa", color: PARENTAL_COLOR,         textColor: "#1F3A52" },
  parental_pm:         { label: "Parental leave (PM)",       short: "PLp", color: PARENTAL_COLOR,         textColor: "#1F3A52" },
  hospitalisation:     { label: "Hospitalisation leave",     short: "HL",  color: HOSPITALISATION_COLOR,  textColor: "#1E4A44" },
  hospitalisation_am:  { label: "Hospitalisation leave (AM)", short: "HLa", color: HOSPITALISATION_COLOR,  textColor: "#1E4A44" },
  hospitalisation_pm:  { label: "Hospitalisation leave (PM)", short: "HLp", color: HOSPITALISATION_COLOR,  textColor: "#1E4A44" },
  compassionate:       { label: "Compassionate leave",       short: "CoL", color: COMPASSIONATE_COLOR,    textColor: "#47423B" },
  compassionate_am:    { label: "Compassionate leave (AM)",  short: "CoA", color: COMPASSIONATE_COLOR,    textColor: "#47423B" },
  compassionate_pm:    { label: "Compassionate leave (PM)",  short: "CoP", color: COMPASSIONATE_COLOR,    textColor: "#47423B" },
  national_service:    { label: "National Service leave",    short: "NS",  color: NATIONAL_SERVICE_COLOR, textColor: "#464A1C" },
  national_service_am: { label: "National Service leave (AM)", short: "NSa", color: NATIONAL_SERVICE_COLOR, textColor: "#464A1C" },
  national_service_pm: { label: "National Service leave (PM)", short: "NSp", color: NATIONAL_SERVICE_COLOR, textColor: "#464A1C" },
  marriage:            { label: "Marriage leave",            short: "MR",  color: MARRIAGE_COLOR,         textColor: "#5A4A18" },
  marriage_am:         { label: "Marriage leave (AM)",       short: "MRa", color: MARRIAGE_COLOR,         textColor: "#5A4A18" },
  marriage_pm:         { label: "Marriage leave (PM)",       short: "MRp", color: MARRIAGE_COLOR,         textColor: "#5A4A18" },
  exam_study:          { label: "Exam / Study leave",        short: "EX",  color: EXAM_STUDY_COLOR,       textColor: "#5A4326" },
  exam_study_am:       { label: "Exam / Study leave (AM)",   short: "EXa", color: EXAM_STUDY_COLOR,       textColor: "#5A4326" },
  exam_study_pm:       { label: "Exam / Study leave (PM)",   short: "EXp", color: EXAM_STUDY_COLOR,       textColor: "#5A4326" },
};

export const AM_TYPES: ReadonlySet<LeaveType> = new Set([
  "half_day_am",
  "medical_am",
  "childcare_am",
  "parental_am",
  "hospitalisation_am",
  "compassionate_am",
  "national_service_am",
  "marriage_am",
  "exam_study_am",
]);
export const PM_TYPES: ReadonlySet<LeaveType> = new Set([
  "half_day_pm",
  "medical_pm",
  "childcare_pm",
  "parental_pm",
  "hospitalisation_pm",
  "compassionate_pm",
  "national_service_pm",
  "marriage_pm",
  "exam_study_pm",
]);

export type LeaveCategory =
  | "annual"
  | "medical"
  | "childcare"
  | "block"
  | "parental"
  | "hospitalisation"
  | "compassionate"
  | "national_service"
  | "marriage"
  | "exam_study";
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
    case "parental":            return { category: "parental",         period: "full" };
    case "parental_am":         return { category: "parental",         period: "am" };
    case "parental_pm":         return { category: "parental",         period: "pm" };
    case "hospitalisation":     return { category: "hospitalisation",  period: "full" };
    case "hospitalisation_am":  return { category: "hospitalisation",  period: "am" };
    case "hospitalisation_pm":  return { category: "hospitalisation",  period: "pm" };
    case "compassionate":       return { category: "compassionate",    period: "full" };
    case "compassionate_am":    return { category: "compassionate",    period: "am" };
    case "compassionate_pm":    return { category: "compassionate",    period: "pm" };
    case "national_service":    return { category: "national_service", period: "full" };
    case "national_service_am": return { category: "national_service", period: "am" };
    case "national_service_pm": return { category: "national_service", period: "pm" };
    case "marriage":            return { category: "marriage",         period: "full" };
    case "marriage_am":         return { category: "marriage",         period: "am" };
    case "marriage_pm":         return { category: "marriage",         period: "pm" };
    case "exam_study":          return { category: "exam_study",       period: "full" };
    case "exam_study_am":       return { category: "exam_study",       period: "am" };
    case "exam_study_pm":       return { category: "exam_study",       period: "pm" };
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
  if (category === "childcare") {
    if (period === "am") return "childcare_am";
    if (period === "pm") return "childcare_pm";
    return "childcare";
  }
  // Statutory leave types share the `${category}` / `${category}_am` / `${category}_pm` naming.
  if (period === "am") return `${category}_am`;
  if (period === "pm") return `${category}_pm`;
  return category;
}

export const PUBLIC_HOLIDAY_COLOR = "#F2C79A";
export const WEEKEND_COLOR = "#c8ccd1";

export const IMPORTANT_COLORS = [
  { key: "lemon", hex: "#F7E27A" },
  { key: "teal",  hex: "#A8DBD0" },
  { key: "sky",   hex: "#B5CDE6" },
  { key: "denim", hex: "#8FAACB" },
] as const;

export type ImportantColorKey = (typeof IMPORTANT_COLORS)[number]["key"];

export const importantHex = (key: string) =>
  IMPORTANT_COLORS.find((c) => c.key === key)?.hex ?? IMPORTANT_COLORS[0].hex;
