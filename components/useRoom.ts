"use client";

import { useEffect, useState } from "react";

export type RoomState = {
  people: { you: boolean; emoji: string; minutesIn: number; planned: number }[];
  last24h: { sessions: number; minutes: number };
};

/** Polls the focus room every `ms`. Pauses while the tab is hidden. */
export function useRoom(ms = 15000) {
  const [room, setRoom] = useState<RoomState | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/room", { cache: "no-store" });
        if (r.ok && alive) setRoom(await r.json());
      } catch {
        /* offline — keep last state */
      }
    };
    load();
    const t = setInterval(load, ms);
    const onVis = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ms]);
  return room;
}
