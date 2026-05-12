import { z } from "zod";
import { LEAVE_TYPES } from "./colors";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const teamName = z
  .string()
  .trim()
  .min(2, "Team name must be at least 2 characters")
  .max(60, "Team name is too long");

const password = z.string().min(6, "Password must be at least 6 characters").max(200);

export const createTeamSchema = z.object({
  name: teamName,
  password,
});

export const loginSchema = z.object({
  name: teamName,
  password: z.string().min(1).max(200),
});

export const memberCreateSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(60),
});

export const memberUpdateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
});

export const leaveCreateSchema = z.object({
  member_id: z.string().uuid(),
  from: isoDate,
  to: isoDate,
  leave_type: z.enum(LEAVE_TYPES),
  notes: z.string().max(500).optional().nullable(),
});

export const leaveUpdateSchema = z.object({
  leave_type: z.enum(LEAVE_TYPES).optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const importantCreateSchema = z.object({
  from: isoDate,
  to: isoDate,
  label: z.string().trim().min(1).max(100),
  color_key: z.string().min(1).max(20),
  notes: z.string().max(500).optional().nullable(),
});

export const importantUpdateSchema = z.object({
  date: isoDate.optional(),
  label: z.string().trim().min(1).max(100).optional(),
  color_key: z.string().min(1).max(20).optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const dataQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
});
