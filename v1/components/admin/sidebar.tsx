"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Code2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Plug,
  Settings,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "General",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/appliances", label: "Appliances", icon: Plug },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/developers", label: "Developers", icon: Code2 },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

const SIDEBAR_BG = "bg-[#1b283b]";

/** Shared nav body — used by the desktop sidebar and the mobile sheet. */
export function AdminSidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5" aria-label="Admin navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p
            className={`px-4 pb-1.5 text-[10px] font-semibold tracking-widest text-gray-400/70 uppercase ${
              collapsed ? "lg:px-0 lg:text-center" : ""
            }`}
          >
            <span className={collapsed ? "lg:hidden" : ""}>{section.label}</span>
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      collapsed ? "lg:justify-center lg:px-0" : ""
                    } ${
                      active
                        ? "rounded-md bg-emerald-600 text-white shadow-sm"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function SidebarLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/admin"
      className={`block rounded-lg bg-white px-3 py-2 ${collapsed ? "lg:px-2" : ""}`}
    >
      {collapsed ? (
        <>
          <span className="hidden items-center justify-center lg:flex">
            <Image src="/logo.png" alt="SunVolt" width={36} height={36} className="h-9 w-auto" />
          </span>
          <span className="flex items-center gap-2.5 lg:hidden">
            <Image src="/logo.png" alt="SunVolt" width={120} height={30} className="h-7 w-auto" />
          </span>
        </>
      ) : (
        <Image src="/logo.png" alt="SunVolt" width={150} height={34} className="h-8 w-auto" priority />
      )}
    </Link>
  );
}

export function SidebarFooterLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-0.5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white"
      >
        <Link href="/" target="_blank" onClick={onNavigate}>
          <ExternalLink aria-hidden />
          View Store
        </Link>
      </Button>
      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-300 hover:bg-white/10 hover:text-red-200"
        >
          <LogOut aria-hidden />
          Sign out
        </Button>
      </form>
    </div>
  );
}

const COLLAPSE_KEY = "sunvolt-admin-sidebar-collapsed";
const COLLAPSE_EVENT = "sunvolt-admin-sidebar-change";

function readCollapsed(): boolean {
  return window.localStorage.getItem(COLLAPSE_KEY) === "1";
}

/** Collapsed state shared by the sidebar and the header's panel toggle. */
export function useSidebarCollapsed(): [boolean, () => void] {
  const subscribeCb = React.useCallback((listener: () => void) => {
    window.addEventListener(COLLAPSE_EVENT, listener);
    return () => window.removeEventListener(COLLAPSE_EVENT, listener);
  }, []);
  const collapsed = React.useSyncExternalStore(
    subscribeCb,
    readCollapsed,
    () => false,
  );
  const toggle = React.useCallback(() => {
    window.localStorage.setItem(COLLAPSE_KEY, readCollapsed() ? "0" : "1");
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }, []);
  return [collapsed, toggle];
}

export function AdminSidebar({ email }: { email: string }) {
  const [collapsed] = useSidebarCollapsed();

  return (
    <aside
      className={`hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:transition-[width] lg:duration-200 ${SIDEBAR_BG} ${
        collapsed ? "lg:w-[76px]" : "lg:w-64"
      }`}
    >
      <div className="flex h-full flex-col p-3">
        <div className={`pb-4 ${collapsed ? "lg:flex lg:justify-center" : ""}`}>
          <SidebarLogo collapsed={collapsed} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminSidebarNav collapsed={collapsed} />
        </div>

        <div className="border-t border-white/10 pt-3">
          <p
            className={`truncate px-4 text-xs text-gray-400 ${collapsed ? "lg:hidden" : ""}`}
            title={email}
          >
            {email}
          </p>
        </div>
      </div>
    </aside>
  );
}
