import { body, json, withUser } from "@/lib/api";
import { db, now } from "@/lib/db";

export async function POST(req: Request) {
  return withUser(async (u) => {
    const { id } = await body<{ id: string }>(req);
    const t = now();
    const r = db
      .prepare(
        `UPDATE focus_sessions SET last_heartbeat = ?, focused_seconds = (? - started_at) / 1000
         WHERE id = ? AND user_id = ? AND outcome = 'active'`,
      )
      .run(t, t, String(id ?? ""), u.id);
    return json({ ok: r.changes > 0 });
  });
}
