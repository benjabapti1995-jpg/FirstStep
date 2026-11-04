"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRoom } from "./useRoom";

type Stage = "step" | "time" | "focus" | "end";
type Outcome = "step_done" | "task_done" | "stopped";

const MINUTES = [2, 5, 10, 15, 25];

const fmt = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function FocusFlow({ task, aiSteps }: { task: { id: string; title: string }; aiSteps: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("step");
  const [step, setStep] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [session, setSession] = useState<{ id: string; startedAt: number } | null>(null);
  const [outcome, setOutcome] = useState<{ type: Outcome; secs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (mins: number) => {
    setError(null);
    setMinutes(mins);
    const r = await fetch("/api/focus/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ taskId: task.id, firstStep: step, minutes: mins }),
    });
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).error ?? "Couldn't start. Try again?");
      return;
    }
    const data = (await r.json()) as { id: string; startedAt: number };
    // Use the local clock for the countdown so client/server clock drift doesn't matter.
    setSession({ id: data.id, startedAt: Date.now() });
    setStage("focus");
  };

  const end = async (type: Outcome) => {
    if (!session) return;
    const secs = (Date.now() - session.startedAt) / 1000;
    setOutcome({ type, secs });
    setStage("end");
    await fetch("/api/focus/end", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: session.id, outcome: type }),
    }).catch(() => {});
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/app" className="text-sm text-muted hover:text-ink">← Today</Link>
        <p className="truncate text-sm text-muted" title={task.title}>{task.title}</p>
      </div>

      {stage === "step" && (
        <StepPicker
          task={task.title}
          aiSteps={aiSteps}
          initial={step}
          onPick={(s) => {
            setStep(s);
            setStage("time");
          }}
        />
      )}

      {stage === "time" && (
        <div className="pop-in space-y-6">
          <div className="card p-5">
            <p className="text-sm font-medium text-muted">Your tiny first step</p>
            <p className="font-display mt-1 text-2xl font-semibold">{step}</p>
            <button className="mt-2 text-sm text-accent underline-offset-2 hover:underline" onClick={() => setStage("step")}>
              Change it
            </button>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">How long? Pick whatever feels easy.</h1>
            <p className="mt-1 text-sm text-muted">When time&apos;s up, nothing stops you. Keep going if you&apos;re in it.</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  onClick={() => start(m)}
                  className={`card flex flex-col items-center py-4 transition-transform hover:-translate-y-0.5 ${m === 5 ? "ring-2 ring-accent" : ""}`}
                >
                  <span className="font-display text-2xl font-semibold">{m}</span>
                  <span className="text-xs text-muted">min</span>
                </button>
              ))}
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-accent">{error}</p>}
          </div>
        </div>
      )}

      {stage === "focus" && session && (
        <FocusTimer step={step} minutes={minutes} session={session} onEnd={end} />
      )}

      {stage === "end" && outcome && (
        <EndScreen
          outcome={outcome}
          onNextStep={() => {
            setStep("");
            setSession(null);
            setOutcome(null);
            setStage("step");
          }}
          onTaskDone={async () => {
            if (session) {
              await fetch("/api/focus/end", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: session.id, outcome: "task_done" }),
              }).catch(() => {});
            }
            setOutcome({ ...outcome, type: "task_done" });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StepPicker({
  task,
  aiSteps,
  initial,
  onPick,
}: {
  task: string;
  aiSteps: boolean;
  initial: string;
  onPick: (s: string) => void;
}) {
  const [steps, setSteps] = useState<string[] | null>(null);
  const [source, setSource] = useState<"ai" | "templates">("templates");
  const [loading, setLoading] = useState(false);
  const [custom, setCustom] = useState(initial);
  const [smallerCount, setSmallerCount] = useState(0);

  const load = useCallback(
    async (smaller: boolean) => {
      setLoading(true);
      try {
        const r = await fetch("/api/steps", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ task, smaller }),
        });
        const d = (await r.json()) as { steps?: string[]; source?: "ai" | "templates" };
        setSteps(d.steps ?? []);
        setSource(d.source ?? "templates");
      } catch {
        setSteps(["Open whatever you need for it", "Just sit down where you'd do it", "Write one line about what 'done' means"]);
      } finally {
        setLoading(false);
      }
    },
    [task],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <div className="pop-in space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">What&apos;s the tiniest first step?</h1>
        <p className="mt-1 text-muted">Not the whole task. Just something you could do in two minutes.</p>
      </div>

      <ul className="space-y-2" aria-busy={loading}>
        {loading && !steps
          ? [0, 1, 2].map((i) => <li key={i} className="h-14 animate-pulse rounded-2xl bg-surface-2" />)
          : steps?.map((s) => (
              <li key={s}>
                <button
                  onClick={() => onPick(s)}
                  className="card flex w-full items-center justify-between gap-3 p-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="font-medium">{s}</span>
                  <span className="text-accent" aria-hidden="true">→</span>
                </button>
              </li>
            ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn btn-ghost text-sm"
          disabled={loading}
          onClick={() => {
            setSmallerCount((c) => c + 1);
            load(true);
          }}
        >
          {smallerCount === 0 ? "Still too big? Make it smaller" : "Even smaller"}
        </button>
        <span className="text-xs text-muted">
          {source === "ai" ? "✦ Suggested by AI for this task" : aiSteps ? "" : "Pro gets AI suggestions tailored to your exact task"}
        </span>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom.trim()) onPick(custom.trim());
        }}
      >
        <input
          className="input"
          placeholder="Or write your own tiny step"
          value={custom}
          maxLength={200}
          onChange={(e) => setCustom(e.target.value)}
          aria-label="Your own first step"
        />
        <button className="btn btn-primary" disabled={!custom.trim()}>Use</button>
      </form>
    </div>
  );
}

function FocusTimer({
  step,
  minutes,
  session,
  onEnd,
}: {
  step: string;
  minutes: number;
  session: { id: string; startedAt: number };
  onEnd: (o: Outcome) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [chime, setChime] = useState(false);
  const chimed = useRef(false);
  const ended = useRef(false);
  const room = useRoom(15000);
  const total = minutes * 60;
  const over = elapsed >= total;

  // Tick from wall-clock time so background tabs stay accurate.
  useEffect(() => {
    const tick = () => setElapsed((Date.now() - session.startedAt) / 1000);
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [session.startedAt]);

  // Heartbeat keeps you visible in the focus room.
  useEffect(() => {
    const beat = () =>
      fetch("/api/focus/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: session.id }),
      }).catch(() => {});
    const t = setInterval(beat, 20000);
    return () => clearInterval(t);
  }, [session.id]);

  // If the tab closes mid-session, record it as a (still valid) stop.
  useEffect(() => {
    const onHide = () => {
      if (!ended.current) navigator.sendBeacon("/api/focus/end", JSON.stringify({ id: session.id, outcome: "stopped" }));
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [session.id]);

  // Optional soft chime, once, when time is up. Off by default so it never breaks flow.
  useEffect(() => {
    if (!over || chimed.current || !chime) return;
    chimed.current = true;
    try {
      const ctx = new AudioContext();
      [523.25, 659.25].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        o.type = "sine";
        g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.18 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 1.2);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.18);
        o.stop(ctx.currentTime + i * 0.18 + 1.3);
      });
    } catch {
      /* audio not available */
    }
  }, [over, chime]);

  const finish = (o: Outcome) => {
    ended.current = true;
    onEnd(o);
  };

  const r = 110;
  const c = 2 * Math.PI * r;
  const progress = Math.min(1, elapsed / total);
  const others = room?.people.filter((p) => !p.you) ?? [];

  return (
    <div className="pop-in flex flex-col items-center text-center">
      <p className="text-sm font-medium text-muted">Just this:</p>
      <h1 className="font-display mt-1 max-w-md text-3xl font-semibold leading-tight">{step}</h1>

      <div className="relative my-8 h-64 w-64">
        {over && <div className="breathe absolute inset-2 rounded-full bg-calm-soft" aria-hidden="true" />}
        <svg viewBox="0 0 240 240" className="relative h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="120" cy="120" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
          <circle
            cx="120"
            cy="120"
            r={r}
            fill="none"
            stroke={over ? "var(--calm)" : "var(--accent)"}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" role="timer" aria-live="off">
          {over ? (
            <>
              <span className="text-sm font-semibold text-calm">Time&apos;s up — you did it</span>
              <span className="font-display text-5xl font-semibold tabular-nums">+{fmt(elapsed - total)}</span>
              <span className="mt-1 text-xs text-muted">bonus time, if you&apos;re in it</span>
            </>
          ) : (
            <>
              <span className="font-display text-6xl font-semibold tabular-nums">{fmt(total - elapsed)}</span>
              <span className="mt-1 text-xs text-muted">of {minutes} min</span>
            </>
          )}
        </div>
      </div>

      <div className="mb-8 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm">
        <span aria-hidden="true">{others.slice(0, 6).map((p) => p.emoji).join(" ") || "🕯️"}</span>
        <span className="text-muted">
          {others.length === 0
            ? "You're holding the room right now"
            : `${others.length} other${others.length === 1 ? "" : "s"} focusing with you`}
        </span>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <button className="btn btn-primary btn-lg" onClick={() => finish("step_done")}>
          I did the step
        </button>
        <button className="btn btn-ghost" onClick={() => finish("stopped")}>
          Stop here — that still counts
        </button>
        <label className="mt-2 flex items-center justify-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={chime} onChange={(e) => setChime(e.target.checked)} className="accent-[var(--accent)]" />
          Soft chime when time&apos;s up
        </label>
      </div>
    </div>
  );
}

function EndScreen({
  outcome,
  onNextStep,
  onTaskDone,
}: {
  outcome: { type: Outcome; secs: number };
  onNextStep: () => void;
  onTaskDone: () => void;
}) {
  const mins = Math.max(1, Math.round(outcome.secs / 60));
  const headline =
    outcome.type === "task_done"
      ? "Done. The whole thing."
      : outcome.type === "step_done"
        ? "You started. That was the hard part."
        : "You showed up. That counts.";
  const sub =
    outcome.type === "task_done"
      ? "It's on your wins wall now."
      : outcome.type === "step_done"
        ? `${mins} minute${mins === 1 ? "" : "s"} of real progress. Want another tiny step while you've got momentum?`
        : `${mins} minute${mins === 1 ? "" : "s"} more than zero. It worked for that long — and that's a win.`;

  return (
    <div className="pop-in flex flex-col items-center py-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-calm-soft text-3xl text-calm" aria-hidden="true">
        ✓
      </div>
      <h1 className="font-display text-3xl font-semibold">{headline}</h1>
      <p className="mt-2 max-w-md text-muted">{sub}</p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-2">
        {outcome.type !== "task_done" && (
          <>
            <button className="btn btn-primary btn-lg" onClick={onNextStep}>Next tiny step</button>
            <button className="btn btn-calm" onClick={onTaskDone}>The whole task is done</button>
          </>
        )}
        <Link href="/app" className="btn btn-ghost">Back to today</Link>
      </div>
    </div>
  );
}
