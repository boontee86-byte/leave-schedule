// Singapore public holidays. Source:
// https://www.mom.gov.sg/employment-practices/public-holidays
// 2026 and 2027 are published; extend this list when 2028 is released.
// Holidays falling on a Sunday get an "(observed)" entry on the Monday.

export type PublicHoliday = { date: string; label: string };

export const SG_PUBLIC_HOLIDAYS: PublicHoliday[] = [
  { date: "2026-01-01", label: "New Year's Day" },
  { date: "2026-02-17", label: "Chinese New Year" },
  { date: "2026-02-18", label: "Chinese New Year" },
  { date: "2026-03-21", label: "Hari Raya Puasa" },
  { date: "2026-04-03", label: "Good Friday" },
  { date: "2026-05-01", label: "Labour Day" },
  { date: "2026-05-27", label: "Hari Raya Haji" },
  { date: "2026-05-31", label: "Vesak Day" },
  { date: "2026-06-01", label: "Vesak Day (observed)" },
  { date: "2026-08-09", label: "National Day" },
  { date: "2026-08-10", label: "National Day (observed)" },
  { date: "2026-11-08", label: "Deepavali" },
  { date: "2026-11-09", label: "Deepavali (observed)" },
  { date: "2026-12-25", label: "Christmas Day" },
  { date: "2027-01-01", label: "New Year's Day" },
  { date: "2027-02-06", label: "Chinese New Year" },
  { date: "2027-02-07", label: "Chinese New Year" },
  { date: "2027-02-08", label: "Chinese New Year (observed)" },
  { date: "2027-03-10", label: "Hari Raya Puasa" },
  { date: "2027-03-26", label: "Good Friday" },
  { date: "2027-05-01", label: "Labour Day" },
  { date: "2027-05-17", label: "Hari Raya Haji" },
  { date: "2027-05-20", label: "Vesak Day" },
  { date: "2027-08-09", label: "National Day" },
  { date: "2027-10-28", label: "Deepavali" },
  { date: "2027-12-25", label: "Christmas Day" },
];

const HOLIDAY_BY_DATE = new Map<string, PublicHoliday>(
  SG_PUBLIC_HOLIDAYS.map((h) => [h.date, h]),
);

export function isPublicHoliday(isoDate: string): boolean {
  return HOLIDAY_BY_DATE.has(isoDate);
}

export function holidayFor(isoDate: string): PublicHoliday | undefined {
  return HOLIDAY_BY_DATE.get(isoDate);
}

export function holidaysInRange(fromISO: string, toISO: string): PublicHoliday[] {
  return SG_PUBLIC_HOLIDAYS.filter((h) => h.date >= fromISO && h.date <= toISO);
}
