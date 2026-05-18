import type { MemberBalance } from "@/app/team/components/types";

export type Category = "annual" | "medical" | "childcare";

export const CATEGORIES: Category[] = ["annual", "childcare", "medical"];

export const CATEGORY_LABEL: Record<Category, string> = {
  annual: "Annual leave",
  childcare: "Family / Childcare leave",
  medical: "Medical leave",
};

// Only annual leave has brought-forward + in-lieu.
export function hasExtras(cat: Category): boolean {
  return cat === "annual";
}

export function defaultInLieuAnnual(year: number): number {
  return year === 2026 ? 1 : 0;
}

export function emptyBalance(member_id: string, year: number): MemberBalance {
  return {
    member_id,
    year,
    entitlement_annual: 0,
    entitlement_medical: 0,
    entitlement_childcare: 0,
    carry_forward_annual: 0,
    in_lieu_annual: defaultInLieuAnnual(year),
  };
}

export function entitlement(b: MemberBalance, cat: Category): number {
  return b[`entitlement_${cat}`];
}

export function carryForward(b: MemberBalance, cat: Category): number {
  return cat === "annual" ? b.carry_forward_annual : 0;
}

export function inLieu(b: MemberBalance, cat: Category): number {
  return cat === "annual" ? b.in_lieu_annual : 0;
}

export function available(b: MemberBalance, cat: Category): number {
  return entitlement(b, cat) + carryForward(b, cat) + inLieu(b, cat);
}
