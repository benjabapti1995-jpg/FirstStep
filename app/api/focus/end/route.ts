import { revalidatePath } from "next/cache";
import { body, json, withUser } from "@/lib/api";
import { db, now } from "@/lib/db";

const OUTCOMES = new Set(["step_done", "task_done", "stopped"]);

// Also called via navigator.sendBeacon (text/plain body) when the tab closes.
export async function POST(req: Request) {
  return withUser(async (u) => {
    const b = await body<{ id: string; outcome: string }>(req);
    const outcome = OUTCOMES.has(String(b.outcome)) ? String(b.outcome) : "stopped";
    const s = db
      .prepare("SELECT id, task_id, started_at, outcome FROM focus_sessions WHERE id = ? AND user_id = ?")
      .get(String(b.id ?? ""), u.id) as { id: string; task_id: string | null; started_at: number; outcome: string } | undefined;
    if (!s) return json({ error: "Session not found" }, 404);

    const t = now();
    if (s.outcome === "active") {
      db.prepare(
        "UPDATE focus_sessions SET outcome = ?, ended_at = ?, last_heartbeat = ?, focused_seconds = (? - started_at) / 1000 WHERE id = ?",
      ).run(outcome, t, t, t, s.id);
    } else if (outcome === "task_done") {
      // Session already ended (e.g. "step done" then "whole task done") — just upgrade the outcome.
      db.prepare("UPDATE focus_sessions SET outcome = 'task_done' WHERE id = ?").run(s.id);
    }
    if (outcome === "task_done" && s.task_id) {
      db.prepare("UPDATE tasks SET status = 'done', done_at = ? WHERE id = ? AND user_id = ?").run(t, s.task_id, u.id);
    }
    revalidatePath("/app");
    revalidatePath("/app/wins");
    const row = db.prepare("SELECT focused_seconds FROM focus_sessions WHERE id = ?").get(s.id) as { focused_seconds: number };
    return json({ ok: true, focusedSeconds: row.focused_seconds });
  });
}
