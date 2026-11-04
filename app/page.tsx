import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getUser } from "@/lib/auth";
import { PRO_PRICE_LABEL } from "@/lib/plans";

const QUOTES = [
  { text: "Starting feels like pushing through a wall — even when the task is small." },
  { text: "Breaking it into steps just turns into hours of making lists instead of doing." },
  { text: "Timers that force a break kill my focus right when I finally get going." },
  { text: "I work so much better when someone else is just… there." },
];

const FEATURES = [
  {
    title: "Only three things today",
    body: "Everything else goes in a parking lot you don't have to look at. No 47-item lists staring back at you.",
    icon: "3",
  },
  {
    title: "One tiny first step",
    body: "Not a plan. Not a breakdown. Just the next 2-minute action — and a “make it smaller” button for bad days.",
    icon: "↘",
  },
  {
    title: "A timer that won't break your flow",
    body: "Pick 2 to 25 minutes. When it ends, it just glows. Keep going if you're in the zone — nothing interrupts you.",
    icon: "◔",
  },
  {
    title: "Focus room",
    body: "See who else is working right now. Quiet, anonymous body-doubling, any time of day.",
    icon: "●",
  },
  {
    title: "Every start counts",
    body: "No streaks to break, no guilt. Stopped after 4 minutes? That's a win on your wall.",
    icon: "✓",
  },
  {
    title: "Wins wall",
    body: "Finished tasks become sticky notes you peel off. Your proof that you do get things done.",
    icon: "▤",
  },
];

export default async function Home() {
  const user = await getUser();
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/app" className="btn btn-primary">Open app</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
              <Link href="/signup" className="btn btn-primary">Start free</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
            Built for ADHD brains
          </p>
          <h1 className="font-display max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl">
            You don&apos;t need more motivation. You need a smaller first step.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            FirstStep gets you from &ldquo;I should really…&rdquo; to actually doing it. Three tasks, one tiny step,
            a timer that respects your flow, and people working alongside you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/app" : "/signup"} className="btn btn-primary btn-lg">Start the thing — free</Link>
            <a href="#how" className="btn btn-ghost btn-lg">How it works</a>
          </div>
        </section>

        <section aria-labelledby="heard" className="border-y border-line bg-surface-2/60">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <h2 id="heard" className="font-display text-2xl font-semibold sm:text-3xl">
              We read thousands of comments from people stuck at the starting line.
            </h2>
            <p className="mt-2 text-muted">The same few things came up again and again. They shaped every part of this app.</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {QUOTES.map((q, i) => (
                <li
                  key={i}
                  className={`note ${["note-yellow", "note-pink", "note-green", "note-blue"][i]} text-xl leading-snug`}
                  style={{ transform: `rotate(${[-1.2, 0.8, -0.6, 1.1][i]}deg)` }}
                >
                  {q.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Pick one of today's three", "Not the whole list. Just one."],
              ["Choose a tiny first step", "“Open the doc and write one ugly sentence.”"],
              ["Start a short timer", "Work alongside others. Keep going or stop — both count."],
            ].map(([t, b], i) => (
              <li key={i} className="card p-5">
                <span className="font-display text-3xl font-semibold text-accent">{i + 1}</span>
                <h3 className="mt-2 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft font-display text-lg font-semibold text-accent" aria-hidden="true">
                  {f.icon}
                </span>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">Pricing</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-semibold">Free</h3>
              <p className="font-display mt-1 text-4xl font-semibold">$0</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>✓ Today&apos;s three + parking lot (15 items)</li>
                <li>✓ Tiny-step suggestions</li>
                <li>✓ Flow-friendly timer</li>
                <li>✓ Focus room</li>
                <li>✓ Wins wall (last 7 days)</li>
              </ul>
              <Link href={user ? "/app" : "/signup"} className="btn btn-ghost mt-6 w-full">Start free</Link>
            </div>
            <div className="card relative p-6 ring-2 ring-accent">
              <span className="absolute -top-3 right-5 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-ink">Pro</span>
              <h3 className="font-semibold">Pro</h3>
              <p className="font-display mt-1 text-4xl font-semibold">
                {PRO_PRICE_LABEL.split("/")[0]}<span className="text-base font-normal text-muted">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>✓ Everything in Free</li>
                <li>✓ AI first steps tailored to your exact task</li>
                <li>✓ Unlimited parking lot</li>
                <li>✓ Full wins history, forever</li>
              </ul>
              <Link href={user ? "/app/billing" : "/signup?next=/app/billing"} className="btn btn-primary mt-6 w-full">Go Pro</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:px-6">
          <span>© {new Date().getFullYear()} FirstStep</span>
          <span>Not a medical product. Be kind to your brain.</span>
        </div>
      </footer>
    </div>
  );
}
