"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(
    login,
    undefined,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="admin@sunvolt.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      {state?.message ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full font-semibold" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          <>
            <LogIn aria-hidden />
            Sign in
          </>
        )}
      </Button>
    </form>
  );
}
