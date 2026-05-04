import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(err.issues.map((i) => i.message).join(", "), 400);
  }
  const status = (err as { status?: number })?.status;
  if (status === 401) return jsonError("Unauthorized", 401);
  console.error(err);
  return jsonError("Server error", 500);
}
