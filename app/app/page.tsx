import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LIMITS, limitsFor } from "@/lib/plans";
import { TaskBoard, type Task } from "@/components/TaskBoard";

export const metadata = { title: "Today — FirstStep" };

function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 5 ? "Still up" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
  return `${part}, ${name}.`;
}

export default async function TodayPage() {
  const user = await requireUser();
  // node:sqlite rows have a null prototype; copy into plain objects before passing to a client component.
  const tasks = (
    db
      .prepare("SELECT id, title, list FROM tasks WHERE user_id = ? AND status = 'open' ORDER BY created_at ASC")
      .all(user.id) as Task[]
  ).map((t) => ({ id: t.id, title: t.title, list: t.list }));

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayStats = db
    .prepare(
      `SELECT COUNT(*) starts, COALESCE(SUM(focused_seconds), 0) secs
       FROM focus_sessions WHERE user_id = ? AND started_at >= ?`,
    )
    .get(user.id, startOfDay.getTime()) as { starts: number; secs: number };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{greeting(user.name)}</h1>
        <p className="mt-1 text-muted">
          {todayStats.starts === 0
            ? "Pick one thing. Just one. We'll make the first step tiny."
            : `You've started ${todayStats.starts} time${todayStats.starts === 1 ? "" : "s"} today — ${Math.round(todayStats.secs / 60)} focused minutes. That counts.`}
        </p>
      </div>
      <TaskBoard tasks={tasks} todayMax={LIMITS.todayMax} laterMax={limitsFor(user.plan).laterMax} />
    </div>
  );
}
