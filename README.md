# FirstStep

A gentle task starter for ADHD brains: **three tasks, one tiny first step, a timer that doesn't break your flow, and people working alongside you.**

## Why this exists

We pulled ~9,600 top comments from 12 YouTube videos with 5,000+ comments each (ADHD, procrastination, study, burnout, small business, meal prep). The loudest, most-liked unmet need was **starting tasks**:

| What people said (paraphrased) | What FirstStep does |
|---|---|
| Starting feels physically painful, even for small tasks | Picks a 2-minute *first step*, not a plan |
| Breaking tasks down turns into endless list-making | Only shows the next step; "make it smaller" button |
| Pomodoro breaks kill my flow | Timer glows when done and keeps counting — never interrupts |
| I work better when someone is just there | Anonymous live focus room (body doubling) |
| Rewards/streaks make me feel like a failure | No streaks; stopping early still counts as a win |
| Too many tasks overwhelm me | Max 3 tasks on Today; everything else is parked out of sight |

## Features

- Email/password accounts (bcrypt, HTTP-only session cookies)
- **Today's three** + collapsible **parking lot**
- **Start flow**: tiny-step suggestions → choose 2–25 min → focus screen
- Flow-friendly timer with optional soft chime; bonus-time count-up
- **Focus room**: live anonymous presence (emoji + minutes in), no names or task titles shared
- **Wins wall**: done tasks as sticky notes, focused minutes per day
- **Free / Pro ($5/mo)** via Stripe Checkout, billing portal and webhooks
- **Pro AI first steps** tailored to the exact task (Claude), with built-in templates as fallback
- Light + dark mode, mobile-friendly, respects reduced motion

## Run it locally

Requires Node 22.5+ (uses the built-in `node:sqlite`).

```bash
npm install
npm run dev
```

Open http://localhost:3000. The database is created automatically at `data/firststep.db`.

Local demo account created during testing: `demo@firststep.test` / `demo-pass-2026` (local database only).

## Configuration

Copy `.env.example` to `.env.local`. Everything is optional for local use.

- **Payments** — create a Stripe account (test mode), a Product with a $5/month recurring Price, then set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`. For webhooks locally, install the Stripe CLI and run `stripe listen --forward-to localhost:3000/api/stripe/webhook`, then put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`. Test card: `4242 4242 4242 4242`.
- **AI suggestions** — set `ANTHROPIC_API_KEY`. Default model is `claude-opus-5-5`; set `ANTHROPIC_MODEL=claude-haiku-5-5` for a much cheaper per-suggestion cost.

## Deploying on Railway

The repo includes `railway.json` (build `npm run build`, start `npm start`, health check on `/`) and pins Node 24 via `engines` in `package.json`. The app stores data in SQLite, so it **needs a volume** — without one, every deploy wipes all accounts.

1. Sign up at https://railway.com with your GitHub account.
2. **New Project → Deploy from GitHub repo →** pick `FirstStep`. The first deploy starts automatically.
3. Add a disk: right-click the service (or press `Ctrl/Cmd+K`) → **Attach volume**, mount path **`/data`**.
4. Service → **Variables**, add:
   - `DATABASE_PATH` = `/data/firststep.db`
   - `APP_URL` = your public URL (next step), e.g. `https://firststep-production.up.railway.app`
5. Service → **Settings → Networking → Generate Domain**. Copy it into `APP_URL`.
6. Railway redeploys after variable changes. Open the domain and sign up to check it works.

Keep it at **one replica** — SQLite on a volume can't be shared between instances.

Payments and AI (optional, add as Variables later):

- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` — from your Stripe dashboard (test mode first).
- `STRIPE_WEBHOOK_SECRET` — in Stripe, **Developers → Webhooks → Add endpoint** with URL `<APP_URL>/api/stripe/webhook` and events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`; copy its signing secret.
- `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL=claude-haiku-5-5`).

Other hosts work too if they offer a persistent disk (Render, Fly.io, a VPS). Serverless hosts like Vercel don't keep files between requests — to use one, swap `lib/db.ts` for a hosted database (Postgres/Turso).

## Project layout

```
app/
  page.tsx                 landing page
  (auth)/                  login, signup, server actions
  app/                     signed-in app: today, focus/[taskId], room, wins, billing
  api/                     steps, focus start/heartbeat/end, room, stripe/*
components/                TaskBoard, FocusFlow, RoomView, AppNav, Logo
lib/                       db (SQLite schema), auth, plans, steps (templates), ai, stripe
```
