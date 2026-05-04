import type { LeaveType } from "@/lib/colors";

export type Member = { id: string; name: string; sort_order: number };

export type LeaveEntry = {
  id: string;
  member_id: string;
  date: string; // YYYY-MM-DD
  leave_type: LeaveType;
  notes: string | null;
};

export type ImportantDate = {
  id: string;
  date: string;
  label: string;
  color_key: string;
  notes: string | null;
};

export type TeamData = {
  team: { id: string; name: string };
  members: Member[];
  leave_entries: LeaveEntry[];
  important_dates: ImportantDate[];
};

export type Range = { from: string; to: string };
