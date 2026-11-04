"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { db, newId, now } from "@/lib/db";
import { LIMITS, limitsFor } from "@/lib/plans";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function me() {
  const u = await getUser();
  if (!u) throw new Error("Not signed in");
  return u;
}

const count = (userId: string, list: "today" | "later") =>
  (db.prepare("SELECT COUNT(*) n FROM tasks WHERE user_id = ? AND status = 'open' AND list = ?").get(userId, list) as { n: number }).n;

export async function addTask(title: string, list: "today" | "later"): Promise<ActionResult> {
  const u = await me();
  const t = title.trim().slice(0, 200);
  if (!t) return { ok: false, error: "Type something first." };
  if (list === "today" && count(u.id, "today") >= LIMITS.todayMax) {
    list = "later"; // Today is full — park it instead of refusing.
  }
  if (list === "later" && count(u.id, "later") >= limitsFor(u.plan).laterMax) {
    return { ok: false, error: `Your parking lot is full (${limitsFor(u.plan).laterMax} items). Clear one out or go Pro.` };
  }
  db.prepare("INSERT INTO tasks (id, user_id, title, list, created_at) VALUES (?, ?, ?, ?, ?)").run(newId(), u.id, t, list, now());
  revalidatePath("/app");
  return { ok: true };
}

export async function moveTask(id: string, list: "today" | "later"): Promise<ActionResult> {
  const u = await me();
  if (list === "today" && count(u.id, "today") >= LIMITS.todayMax) {
    return { ok: false, error: "Today already has three. Move one out first — three is plenty." };
  }
  db.prepare("UPDATE tasks SET list = ? WHERE id = ? AND user_id = ?").run(list, id, u.id);
  revalidatePath("/app");
  return { ok: true };
}

export async function completeTask(id: string): Promise<ActionResult> {
  const u = await me();
  db.prepare("UPDATE tasks SET status = 'done', done_at = ? WHERE id = ? AND user_id = ?").run(now(), id, u.id);
  revalidatePath("/app");
  revalidatePath("/app/wins");
  return { ok: true };
}

export async function renameTask(id: string, title: string): Promise<ActionResult> {
  const u = await me();
  const t = title.trim().slice(0, 200);
  if (!t) return { ok: false, error: "A task needs a name." };
  db.prepare("UPDATE tasks SET title = ? WHERE id = ? AND user_id = ?").run(t, id, u.id);
  revalidatePath("/app");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const u = await me();
  db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, u.id);
  revalidatePath("/app");
  return { ok: true };
}
