import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Default model per Anthropic's guidance; set ANTHROPIC_MODEL (e.g. claude-haiku-5-5)
// to trade quality for a lower cost per suggestion.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `You help people with ADHD get started on tasks they are avoiding.
Given a task, suggest three "first steps" that are almost embarrassingly small:
physical, concrete, doable in under 2 minutes, no planning or decision-making required.
Smallest first. Each under 12 words. Warm, plain language; no exclamation marks.
If "smaller" is true, make every step even tinier than usual (e.g. "Just open the laptop").`;

let client: Anthropic | null = null;

export async function aiSteps(task: string, smaller: boolean): Promise<string[] | null> {
  if (!aiConfigured()) return null;
  client ??= new Anthropic();
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { steps: { type: "array", items: { type: "string" } } },
            required: ["steps"],
            additionalProperties: false,
          },
        },
      },
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify({ task: task.slice(0, 300), smaller }) }],
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as { steps?: unknown };
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 120))
      : [];
    return steps.length ? steps.slice(0, 3) : null;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.warn("AI steps: rate limited");
    else if (err instanceof Anthropic.AuthenticationError) console.error("AI steps: invalid ANTHROPIC_API_KEY");
    else if (err instanceof Anthropic.APIError) console.error(`AI steps: API error ${err.status}`, err.message);
    else console.error("AI steps failed", err);
    return null; // Caller falls back to templates.
  }
}
