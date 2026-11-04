"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { addTask, completeTask, deleteTask, moveTask, renameTask, type ActionResult } from "@/app/app/actions";

export type Task = { id: string; title: string; list: "today" | "later" };

const NOTE_COLORS = ["note-yellow", "note-pink", "note-green", "note-blue"];
const TILTS = [-1.4, 1, -0.6];

export function TaskBoard({ tasks, todayMax, laterMax }: { tasks: Task[]; todayMax: number; laterMax: number }) {
  const [optimistic, applyOptimistic] = useOptimistic(
    tasks,
    (state: Task[], change: { type: "remove"; id: string } | { type: "move"; id: string; list: Task["list"] }) =>
      change.type === "remove"
        ? state.filter((t) => t.id !== change.id)
        : state.map((t) => (t.id === change.id ? { ...t, list: change.list } : t)),
  );
  const [error, setError] = useState<string | null>(null);
  const [peeling, setPeeling] = useState<string | null>(null);
  const [showLater, setShowLater] = useState(false);
  const [, startTransition] = useTransition();

  const today = optimistic.filter((t) => t.list === "today");
  const later = optimistic.filter((t) => t.list === "later");

  const run = (fn: () => Promise<ActionResult>, optimisticChange?: Parameters<typeof applyOptimistic>[0]) =>
    startTransition(async () => {
      setError(null);
      if (optimisticChange) applyOptimistic(optimisticChange);
      const r = await fn();
      if (!r.ok) setError(r.error);
    });

  const done = (id: string) => {
    setPeeling(id);
    setTimeout(() => run(() => completeTask(id), { type: "remove", id }), 520);
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="today-h">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="today-h" className="font-display text-xl font-semibold">Today&apos;s three</h2>
          <span className="text-sm text-muted">{today.length}/{todayMax}</span>
        </div>

        {today.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-8 text-center">
            <p className="font-display text-lg font-semibold">Nothing here yet — and that&apos;s fine.</p>
            <p className="text-sm text-muted">Add one thing you&apos;ve been putting off. Just one is plenty.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-3">
            {today.map((t, i) => (
              <li
                key={t.id}
                className={`note ${NOTE_COLORS[i % 4]} flex min-h-44 flex-col justify-between ${peeling === t.id ? "peel" : ""}`}
                style={{ ["--tilt" as string]: `${TILTS[i % 3]}deg`, transform: `rotate(${TILTS[i % 3]}deg)` }}
              >
                <EditableTitle task={t} onSave={(title) => run(() => renameTask(t.id, title))} />
                <div className="mt-4 flex flex-col gap-2 font-sans">
                  <Link
                    href={`/app/focus/${t.id}`}
                    className="btn bg-note-ink text-sm text-[#fff8ec] hover:opacity-90"
                  >
                    Start this
                  </Link>
                  <div className="flex justify-between text-xs font-medium">
                    <button className="underline-offset-2 opacity-70 hover:underline hover:opacity-100" onClick={() => done(t.id)}>
                      Mark done
                    </button>
                    <button
                      className="underline-offset-2 opacity-70 hover:underline hover:opacity-100"
                      onClick={() => run(() => moveTask(t.id, "later"), { type: "move", id: t.id, list: "later" })}
                    >
                      Not today
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddTask
        placeholder={today.length < todayMax ? "What's one thing you've been avoiding?" : "Today's full — add it to the parking lot"}
        onAdd={(title) => run(() => addTask(title, today.length < todayMax ? "today" : "later"))}
      />

      {error && (
        <p role="alert" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          {error}
        </p>
      )}

      <section aria-labelledby="later-h" className="card p-4 sm:p-5">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowLater((s) => !s)}
          aria-expanded={showLater}
          aria-controls="later-list"
        >
          <span>
            <span id="later-h" className="font-semibold">Parking lot</span>
            <span className="ml-2 text-sm text-muted">
              {later.length} thing{later.length === 1 ? "" : "s"} you don&apos;t need to think about right now
            </span>
          </span>
          <span className="text-muted" aria-hidden="true">{showLater ? "−" : "+"}</span>
        </button>

        {showLater && (
          <div id="later-list" className="mt-4 space-y-3">
            {later.length === 0 && <p className="text-sm text-muted">Empty. Nice.</p>}
            <ul className="divide-y divide-line">
              {later.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1 text-sm">{t.title}</span>
                  <button
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent-soft disabled:opacity-40"
                    disabled={today.length >= todayMax}
                    title={today.length >= todayMax ? "Today already has three" : "Move to today"}
                    onClick={() => run(() => moveTask(t.id, "today"), { type: "move", id: t.id, list: "today" })}
                  >
                    → Today
                  </button>
                  <button
                    className="rounded-full px-2 py-1 text-xs text-muted hover:bg-surface-2"
                    aria-label={`Delete ${t.title}`}
                    onClick={() => run(() => deleteTask(t.id), { type: "remove", id: t.id })}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <AddTask placeholder={`Park something for later (${later.length}/${laterMax})`} onAdd={(title) => run(() => addTask(title, "later"))} small />
          </div>
        )}
      </section>
    </div>
  );
}

function AddTask({ placeholder, onAdd, small }: { placeholder: string; onAdd: (t: string) => void; small?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const v = ref.current?.value.trim();
        if (!v) return;
        onAdd(v);
        if (ref.current) ref.current.value = "";
      }}
    >
      <input ref={ref} className={`input ${small ? "py-2 text-sm" : ""}`} placeholder={placeholder} maxLength={200} aria-label={placeholder} />
      <button className={`btn btn-primary ${small ? "px-4 py-2 text-sm" : ""}`}>Add</button>
    </form>
  );
}

function EditableTitle({ task, onSave }: { task: Task; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={task.title}
        maxLength={200}
        aria-label="Task name"
        className="w-full rounded bg-white/50 px-1 text-2xl leading-tight outline-none"
        onBlur={(e) => {
          setEditing(false);
          if (e.target.value.trim() && e.target.value.trim() !== task.title) onSave(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }
  return (
    <button className="text-left text-2xl leading-tight" onClick={() => setEditing(true)} title="Click to rename">
      {task.title}
    </button>
  );
}
