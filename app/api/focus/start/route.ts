import { body, json, withUser } from "@/lib/api";
import { db, newId, now } from "@/lib/db";

export async function POST(req: Request) {
  return withUser(async (u) => {
    const b = await body<{ taskId: string; firstStep: string; minutes: number }>(req);
    const step = typeof b.firstStep === "string" ? b.firstStep.trim().slice(0, 200) : "";
    const minutes = Math.round(Number(b.minutes));
    if (!step) return json({ error: "Pick a first step" }, 400);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 90) return json({ error: "Minutes must be 1–90" }, 400);

    const task = db
      .prepare("SELECT id, title FROM tasks WHERE id = ? AND user_id = ?")
      .get(String(b.taskId ?? ""), u.id) as { id: string; title: string } | undefined;
    if (!task) return json({ error: "Task not found" }, 404);

    const t = now();
    // Only one live session per person: close anything left open (e.g. a closed tab).
    db.prepare(
      `UPDATE focus_sessions SET outcome = 'stopped', ended_at = last_heartbeat
       WHERE user_id = ? AND outcome = 'active'`,
    ).run(u.id);

    const id = newId();
    db.prepare(
      `INSERT INTO focus_sessions (id, user_id, task_id, task_title, first_step, planned_minutes, started_at, last_heartbeat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, u.id, task.id, task.title, step, minutes, t, t);
    return json({ id, startedAt: t });
  });
}
