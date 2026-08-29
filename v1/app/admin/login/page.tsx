import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  const { next } = await searchParams;

  return (
    <div className="admin-scope flex min-h-screen bg-gray-50">
      {/* Decorative brand panel (desktop only) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-10 lg:flex lg:w-1/2">
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="flex items-center gap-3 text-white">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
            <Zap className="size-6" aria-hidden />
          </span>
          <span className="text-xl font-bold tracking-tight">SunVolt</span>
        </div>
        <div className="relative text-white">
          <h2 className="max-w-md text-3xl font-bold leading-snug">
            Solar packages, components &amp; orders — all in one panel.
          </h2>
          <p className="mt-3 max-w-md text-emerald-100">
            Manage products, track orders, generate invoices and tune the load
            calculator for your customers.
          </p>
        </div>
        <p className="text-xs text-emerald-200">© {new Date().getFullYear()} SunVolt</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm dark:bg-gray-800">
          <div className="text-center">
            <span className="inline-flex rounded-xl bg-white px-3 py-1.5 ring-1 ring-gray-200">
              <Image src="/logo.png" alt="SunVolt" width={120} height={34} className="h-8 w-auto" />
            </span>
            <h1 className="mt-5 text-xl font-bold">Admin Login</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to manage packages, orders and settings.
            </p>
          </div>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
