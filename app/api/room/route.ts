import { json, LIVE_WINDOW_MS, withUser } from "@/lib/api";
import { db, now } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Anonymous presence: who is focusing right now. Only emoji + minutes — never names or tasks. */
export async function GET() {
  return withUser(async (u) => {
    const t = now();
    const rows = db
      .prepare(
        `SELECT f.user_id, f.started_at, f.planned_minutes, us.room_emoji
         FROM focus_sessions f JOIN users us ON us.id = f.user_id
         WHERE f.outcome = 'active' AND f.last_heartbeat > ?
         ORDER BY f.started_at ASC LIMIT 200`,
      )
      .all(t - LIVE_WINDOW_MS) as { user_id: string; started_at: number; planned_minutes: number; room_emoji: string }[];

    const dayStart = t - 864e5;
    const today = db
      .prepare("SELECT COUNT(*) n, COALESCE(SUM(focused_seconds),0) s FROM focus_sessions WHERE started_at > ?")
      .get(dayStart) as { n: number; s: number };

    return json({
      people: rows.map((r) => ({
        you: r.user_id === u.id,
        emoji: r.room_emoji,
        minutesIn: Math.floor((t - r.started_at) / 60000),
        planned: r.planned_minutes,
      })),
      last24h: { sessions: today.n, minutes: Math.round(today.s / 60) },
    });
  });
}
