import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { db, newId, now } from "./db";

export const SESSION_COOKIE = "fs_session";
const SESSION_DAYS = 30;

export type User = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  room_emoji: string;
  created_at: number;
};

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}

export function findUserByEmail(email: string) {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as (User & { password_hash: string }) | undefined;
}

export async function verifyPassword(email: string, pw: string) {
  const u = findUserByEmail(email);
  // Compare against a dummy hash when the user doesn't exist, to keep timing similar.
  const ok = await bcrypt.compare(pw, u?.password_hash ?? "$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  return ok && u ? u : null;
}

export async function createUser(email: string, name: string, pw: string) {
  const id = newId();
  const emojis = ["🌱", "🐢", "🦊", "🐝", "🌻", "🐙", "🦉", "🍄", "🐳", "🌙"];
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, room_emoji, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, email.trim().toLowerCase(), name.trim(), await hashPassword(pw), emojis[Math.floor(Math.random() * emojis.length)], now());
  return id;
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = now() + SESSION_DAYS * 864e5;
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashToken(token), userId, expires);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  jar.delete(SESSION_COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), now()) as (User & { password_hash?: string }) | undefined;
  if (!row) return null;
  delete row.password_hash;
  return row as User;
}

/** For pages: redirect to login when signed out. */
export async function requireUser(): Promise<User> {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}
