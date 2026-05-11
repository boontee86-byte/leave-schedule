import {
  addDays,
  endOfYear,
  format,
  isSameDay,
  parseISO,
  startOfYear,
} from "date-fns";

export const ISO = "yyyy-MM-dd";

export function toISO(d: Date): string {
  return format(d, ISO);
}

export function fromISO(s: string): Date {
  return parseISO(s);
}

export function defaultRange(today = new Date()): { from: string; to: string } {
  return { from: toISO(startOfYear(today)), to: toISO(endOfYear(today)) };
}

export function expandRange(fromISOStr: string, toISOStr: string): Date[] {
  const start = fromISO(fromISOStr);
  const end = fromISO(toISOStr);
  const out: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    out.push(d);
  }
  return out;
}

export function groupDatesByMonth(dates: Date[]): { label: string; days: Date[] }[] {
  const groups: { label: string; days: Date[] }[] = [];
  for (const d of dates) {
    const label = monthLabel(d);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.days.push(d);
    else groups.push({ label, days: [d] });
  }
  return groups;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function dayName(d: Date): string {
  return format(d, "EEE");
}

export function fullDate(d: Date): string {
  return format(d, "dd MMM yyyy");
}

export function monthLabel(d: Date): string {
  return format(d, "MMMM yyyy");
}

export const sameDay = isSameDay;
