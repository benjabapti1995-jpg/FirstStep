/**
 * Template "tiny first step" suggestions — no AI needed.
 * Each rule gives three options, smallest first, plus an even-smaller fallback.
 */
type Rule = { match: RegExp; steps: string[] };

const RULES: Rule[] = [
  { match: /\b(e-?mail|inbox|reply|respond)\b/i, steps: ["Open your inbox and find that one email", "Write only the first line of the reply", "Type the person's name and a greeting"] },
  { match: /\b(clean|tidy|declutter|dishes|kitchen|room|vacuum)\b/i, steps: ["Pick up 5 things and put them away", "Clear just one surface", "Fill one bag with trash"] },
  { match: /\b(laundry|clothes|fold)\b/i, steps: ["Carry the basket to the machine", "Fold just 3 items", "Put one load in"] },
  { match: /\b(write|essay|report|paper|draft|blog|article|post|thesis|dissertation)\b/i, steps: ["Open the doc and write one ugly sentence", "Write the title and three bullet points", "Paste in your notes — no editing"] },
  { match: /\b(study|revise|exam|test|homework|read|chapter|course|learn)\b/i, steps: ["Open to the right page and read one paragraph", "Do just the first question", "Make 3 flashcards from your notes"] },
  { match: /\b(call|phone|ring|appointment|book|schedule)\b/i, steps: ["Find the number and put it on screen", "Write down the one thing you need to say", "Open the booking page"] },
  { match: /\b(gym|workout|run|walk|exercise|yoga|stretch)\b/i, steps: ["Put your shoes on", "Change into workout clothes", "Do 1 minute of stretching"] },
  { match: /\b(pay|bill|tax|taxes|invoice|budget|bank|money)\b/i, steps: ["Open the bill and find the amount due", "Log in to the account", "Find the one document you need"] },
  { match: /\b(cook|meal|dinner|lunch|groceries|shopping)\b/i, steps: ["Take out one ingredient", "Write a 3-item list", "Fill a pot with water"] },
  { match: /\b(code|bug|fix|deploy|build|app|website)\b/i, steps: ["Open the project and run it", "Read the error message once", "Write a comment describing the change"] },
  { match: /\b(video|edit|record|film|youtube|content|reel|tiktok)\b/i, steps: ["Open the editor and import the files", "Write the first sentence of the script", "Set up the camera — don't record yet"] },
  { match: /\b(apply|application|job|cv|resume|cover letter)\b/i, steps: ["Open the job post", "Update just your most recent role", "Write the first line of the cover letter"] },
];

const DEFAULT = [
  "Open whatever you need for it",
  "Write one line: what does 'done' look like?",
  "Set it up so the next step is obvious",
];

const SMALLER = [
  "Just sit down where you'd do it",
  "Just open it — that's the whole step",
  "Touch the thing. Literally. That counts.",
  "Look at it for 2 minutes, no pressure to act",
];

export function templateSteps(task: string): string[] {
  const rule = RULES.find((r) => r.match.test(task));
  return (rule?.steps ?? DEFAULT).slice(0, 3);
}

export function smallerSteps(): string[] {
  const s = [...SMALLER];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s.slice(0, 3);
}
