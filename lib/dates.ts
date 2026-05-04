import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
} from "date-fns";

export const ISO = "yyyy-MM-dd";

export function toISO(d: Date): string {
  return format(d, ISO);
}

export function fromISO(s: string): Date {
  return parseISO(s);
}

export function defaultRange(today = new Date()): { from: string; to: string } {
  const from = startOfMonth(today);
  const to = endOfMonth(addMonths(today, 2));
  return { from: toISO(from), to: toISO(to) };
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
