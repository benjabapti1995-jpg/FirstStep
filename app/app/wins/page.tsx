import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { limitsFor } from "@/lib/plans";

export const metadata = { title: "Wins — FirstStep" };

type DoneTask = { id: string; title: string; done_at: number };
type Session = { day: string; starts: number; secs: number };

const COLORS = ["note-yellow", "note-pink", "note-green", "note-blue"];

export default async function WinsPage() {
  const user = await requireUser();
  const days = limitsFor(user.plan).winsHistoryDays;
  const since = Date.now() - days * 864e5;

  const done = db
    .prepare("SELECT id, title, done_at FROM tasks WHERE user_id = ? AND status = 'done' AND done_at > ? ORDER BY done_at DESC LIMIT 200")
    .all(user.id, since) as DoneTask[];

  const sessions = db
    .prepare(
      `SELECT date(started_at / 1000, 'unixepoch', 'localtime') day, COUNT(*) starts, SUM(focused_seconds) secs
       FROM focus_sessions WHERE user_id = ? AND started_at > ?
       GROUP BY day ORDER BY day DESC LIMIT 14`,
    )
    .all(user.id, since) as Session[];

  const totals = db
    .prepare("SELECT COUNT(*) starts, COALESCE(SUM(focused_seconds),0) secs FROM focus_sessions WHERE user_id = ? AND started_at > ?")
    .get(user.id, since) as { starts: number; secs: number };

  const hidden =
    user.plan === "free"
      ? (db.prepare("SELECT COUNT(*) n FROM tasks WHERE user_id = ? AND status = 'done' AND done_at <= ?").get(user.id, since) as { n: number }).n
      : 0;

  const maxSecs = Math.max(1, ...sessions.map((s) => s.secs));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Wins wall</h1>
        <p className="mt-1 text-muted">Proof that you do get things done. No streaks, nothing to lose — only things you&apos;ve gained.</p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          ["Tasks done", done.length],
          ["Times you started", totals.starts],
          ["Focused minutes", Math.round(totals.secs / 60)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="font-display mt-1 text-3xl font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {sessions.length > 0 && (
        <section className="card p-5" aria-labelledby="starts-h">
          <h2 id="starts-h" className="font-semibold">Focused minutes by day</h2>
          <ul className="mt-4 space-y-2">
            {sessions.map((s) => (
              <li key={s.day} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted">
                  {new Date(`${s.day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(4, (s.secs / maxSecs) * 100)}%` }} />
                </span>
                <span className="w-28 shrink-0 text-right tabular-nums">
                  {Math.round(s.secs / 60)} min · {s.starts} start{s.starts === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="done-h">
        <h2 id="done-h" className="font-display mb-4 text-xl font-semibold">Done</h2>
        {done.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-semibold">Your first sticky note lands here.</p>
            <p className="mt-1 text-sm text-muted">Finish one tiny thing today — even the smallest one counts.</p>
            <Link href="/app" className="btn btn-primary mt-4">Go to today</Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {done.map((t, i) => (
              <li
                key={t.id}
                className={`note ${COLORS[i % 4]} flex min-h-28 flex-col justify-between text-xl leading-tight`}
                style={{ transform: `rotate(${((i * 37) % 5) - 2}deg)` }}
              >
                <span className="line-through decoration-2 opacity-80">{t.title}</span>
                <span className="mt-2 font-sans text-xs opacity-60">
                  {new Date(t.done_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {hidden > 0 && (
        <p className="card p-4 text-sm">
          {hidden} older win{hidden === 1 ? " is" : "s are"} saved but hidden on Free.{" "}
          <Link href="/app/billing" className="font-medium text-accent underline-offset-2 hover:underline">
            Go Pro to see your full history
          </Link>
        </p>
      )}
    </div>
  );
}
