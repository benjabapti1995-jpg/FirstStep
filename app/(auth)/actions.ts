"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createUser, endSession, findUserByEmail, startSession, verifyPassword } from "@/lib/auth";

export type AuthState = { error?: string; email?: string; name?: string };

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/app") ? s : "/app";
};

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Tell us what to call you").max(60),
  email: z.string().trim().email("That email doesn't look right").max(200),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  });
  const email = String(form.get("email") ?? "");
  const name = String(form.get("name") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email, name };
  if (findUserByEmail(parsed.data.email)) return { error: "There's already an account with that email. Try logging in.", email, name };

  const id = await createUser(parsed.data.email, parsed.data.name, parsed.data.password);
  await startSession(id);
  redirect(safeNext(form.get("next")));
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const user = await verifyPassword(email, password);
  if (!user) return { error: "Email or password is incorrect.", email };
  await startSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/");
}
