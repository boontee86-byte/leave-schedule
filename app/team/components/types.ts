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

export type MemberBalance = {
  member_id: string;
  year: number;
  entitlement_annual: number;
  entitlement_medical: number;
  entitlement_childcare: number;
  carry_forward_annual: number;
  in_lieu_annual: number;
};

export type TeamData = {
  team: { id: string; name: string };
  members: Member[];
  leave_entries: LeaveEntry[];
  important_dates: ImportantDate[];
  balances: MemberBalance[];
  year: number;
};

export type Range = { from: string; to: string };
