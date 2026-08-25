import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
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
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <span className="inline-flex rounded-xl bg-white px-3 py-1.5 ring-1 ring-border">
            <Image src="/logo.png" alt="SunVolt" width={120} height={34} className="h-8 w-auto" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-navy">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage packages, orders and settings.
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
