"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Today" },
  { href: "/app/room", label: "Focus room" },
  { href: "/app/wins", label: "Wins" },
  { href: "/app/billing", label: "Plan" },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav aria-label="App" className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
      {LINKS.map((l) => {
        const active = l.href === "/app" ? path === "/app" || path.startsWith("/app/focus") : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
