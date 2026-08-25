"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  clearAttempts,
  createSessionToken,
  isThrottled,
  recordFailedAttempt,
  verifyCredentials,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().min(3, "Email is required").max(120),
  password: z.string().min(1, "Password is required").max(200),
});

export interface LoginState {
  message: string;
}

export async function login(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const key = parsed.data.email.toLowerCase();
  if (isThrottled(key)) {
    return { message: "Too many attempts. Try again in a few minutes." };
  }

  if (!verifyCredentials(parsed.data.email, parsed.data.password)) {
    recordFailedAttempt(key);
    return { message: "Invalid email or password." };
  }

  clearAttempts(key);
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(parsed.data.email.toLowerCase()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/admin") ? next : "/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
