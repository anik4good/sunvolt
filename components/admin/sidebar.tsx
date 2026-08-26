"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  ClipboardList,
  Code2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/appliances", label: "Appliances", icon: Plug },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/developers", label: "Developers", icon: Code2 },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const links = (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Admin navigation">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-navy text-white"
                : "text-navy/80 hover:bg-secondary"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <aside className="border-b bg-background lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col p-4">
        <Link href="/admin" className="flex items-center gap-2 px-1 pb-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-navy text-solar">
            <Calculator className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-navy">SunVolt</span>
            <span className="block text-xs text-muted-foreground">Admin Panel</span>
          </span>
        </Link>

        {links}

        <div className="mt-auto hidden space-y-1 pt-4 lg:block">
          <p className="px-3 text-xs text-muted-foreground">{email}</p>
          <Button asChild variant="ghost" size="sm" className="w-full justify-start">
            <Link href="/" target="_blank">
              <ExternalLink aria-hidden />
              View Website
            </Link>
          </Button>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <LogOut aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
