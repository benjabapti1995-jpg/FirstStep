import { aiSteps } from "@/lib/ai";
import { body, json, withUser } from "@/lib/api";
import { limitsFor } from "@/lib/plans";
import { smallerSteps, templateSteps } from "@/lib/steps";

export async function POST(req: Request) {
  return withUser(async (u) => {
    const { task, smaller } = await body<{ task: string; smaller: boolean }>(req);
    const title = typeof task === "string" ? task.trim().slice(0, 300) : "";
    if (!title) return json({ error: "Missing task" }, 400);

    if (limitsFor(u.plan).aiSteps) {
      const ai = await aiSteps(title, Boolean(smaller));
      if (ai) return json({ steps: ai, source: "ai" });
    }
    return json({ steps: smaller ? smallerSteps() : templateSteps(title), source: "templates" });
  });
}
