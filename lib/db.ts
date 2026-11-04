import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "firststep.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  room_emoji TEXT NOT NULL DEFAULT '🌱',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  list TEXT NOT NULL DEFAULT 'today',      -- 'today' | 'later'
  status TEXT NOT NULL DEFAULT 'open',     -- 'open' | 'done'
  created_at INTEGER NOT NULL,
  done_at INTEGER
);
CREATE INDEX IF NOT EXISTS tasks_user ON tasks(user_id, status, list);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  first_step TEXT NOT NULL,
  planned_minutes INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  last_heartbeat INTEGER NOT NULL,
  ended_at INTEGER,
  focused_seconds INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'active'   -- 'active' | 'step_done' | 'task_done' | 'stopped'
);
CREATE INDEX IF NOT EXISTS focus_user ON focus_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS focus_live ON focus_sessions(outcome, last_heartbeat);

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  received_at INTEGER NOT NULL
);
`;

const globalForDb = globalThis as unknown as { __firststepDb?: DatabaseSync };

function open(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  // Wait for a lock instead of failing at once if another process holds it.
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  return db;
}

function getDb(): DatabaseSync {
  return (globalForDb.__firststepDb ??= open());
}

// Opened on first use, not at import: `next build` imports every route in
// parallel workers, and opening the file there made them fight over the lock.
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const now = () => Date.now();
export const newId = () => crypto.randomUUID();
