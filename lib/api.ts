import "server-only";
import { NextResponse } from "next/server";
import { getUser, type User } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Run an API handler for a signed-in user; 401 otherwise. */
export async function withUser(fn: (u: User) => Promise<Response>): Promise<Response> {
  const u = await getUser();
  if (!u) return json({ error: "Not signed in" }, 401);
  return fn(u);
}

export async function body<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}

export const LIVE_WINDOW_MS = 60_000;
