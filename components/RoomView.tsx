"use client";

import Link from "next/link";
import { useRoom } from "./useRoom";

export function RoomView() {
  const room = useRoom(10000);
  const people = room?.people ?? [];
  const you = people.find((p) => p.you);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Focus room</h1>
        <p className="mt-1 text-muted">
          Everyone here is working on something right now. No names, no chat, no tasks shown — just quiet company.
        </p>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-xl font-semibold">
            {room === null
              ? "Looking around…"
              : people.length === 0
                ? "The room is quiet right now"
                : `${people.length} ${people.length === 1 ? "person" : "people"} focusing`}
          </p>
          {room && (
            <p className="text-sm text-muted">
              {room.last24h.sessions} starts · {room.last24h.minutes} focused minutes in the last 24h
            </p>
          )}
        </div>

        {people.length > 0 ? (
          <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="People focusing now">
            {people.map((p, i) => (
              <li
                key={i}
                className={`flex flex-col items-center gap-1 rounded-2xl p-3 ${p.you ? "bg-accent-soft" : "bg-surface-2"}`}
              >
                <span className="breathe text-3xl" style={{ animationDelay: `${(i % 5) * 0.7}s` }} aria-hidden="true">
                  {p.emoji}
                </span>
                <span className="text-xs font-medium">{p.you ? "You" : `${p.minutesIn} min in`}</span>
              </li>
            ))}
          </ul>
        ) : (
          room && (
            <p className="mt-4 text-sm text-muted">
              Be the first one in — others will see you here, and it helps them start too.
            </p>
          )
        )}
      </div>

      {!you && (
        <div className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-semibold">Join them.</span>{" "}
            <span className="text-muted">Start any task and you&apos;ll appear here while your timer runs.</span>
          </p>
          <Link href="/app" className="btn btn-primary">Pick a task</Link>
        </div>
      )}
    </div>
  );
}
