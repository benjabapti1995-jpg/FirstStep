import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { limitsFor } from "@/lib/plans";
import { FocusFlow } from "@/components/FocusFlow";

export const metadata = { title: "Start — FirstStep" };

export default async function FocusPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const user = await requireUser();
  const task = db
    .prepare("SELECT id, title, status FROM tasks WHERE id = ? AND user_id = ?")
    .get(taskId, user.id) as { id: string; title: string; status: string } | undefined;
  if (!task) notFound();

  return <FocusFlow task={{ id: task.id, title: task.title }} aiSteps={limitsFor(user.plan).aiSteps} />;
}
