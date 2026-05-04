export const LEAVE_TYPES = [
  "full_day",
  "half_day_am",
  "half_day_pm",
  "travel",
  "medical",
  "childcare",
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_META: Record<
  LeaveType,
  { label: string; short: string; color: string; textColor: string }
> = {
  full_day:    { label: "Full day",        short: "FD", color: "#C8DCC2", textColor: "#2F4A2C" },
  half_day_am: { label: "Half day (AM)",   short: "AM", color: "#F8D7B8", textColor: "#6B3F1A" },
  half_day_pm: { label: "Half day (PM)",   short: "PM", color: "#F8D7B8", textColor: "#6B3F1A" },
  travel:      { label: "Travel",          short: "T",  color: "#C9DCEA", textColor: "#26415A" },
  medical:     { label: "Medical leave",   short: "M",  color: "#EAC4C9", textColor: "#5A2A35" },
  childcare:   { label: "Childcare leave", short: "CC", color: "#D9CFE6", textColor: "#3E2F58" },
};

export const IMPORTANT_COLORS = [
  { key: "amber",  hex: "#F5DDA2" },
  { key: "rose",   hex: "#EAC4C9" },
  { key: "sage",   hex: "#C8DCC2" },
  { key: "sky",    hex: "#C9DCEA" },
] as const;

export type ImportantColorKey = (typeof IMPORTANT_COLORS)[number]["key"];

export const importantHex = (key: string) =>
  IMPORTANT_COLORS.find((c) => c.key === key)?.hex ?? IMPORTANT_COLORS[0].hex;
