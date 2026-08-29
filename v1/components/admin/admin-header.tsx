"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { logout } from "@/app/admin/login/actions";
import { useAdminTheme } from "@/components/admin/admin-theme";
import {
  AdminSidebarNav,
  SidebarFooterLinks,
  SidebarLogo,
  useSidebarCollapsed,
} from "@/components/admin/sidebar";

function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState("");

  return (
    <form
      className="hidden md:block"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(q.trim() ? `/admin/products?q=${encodeURIComponent(q.trim())}` : "/admin/products");
      }}
    >
      <label className="flex h-9 w-64 items-center gap-2 rounded-full bg-gray-100 px-3.5 text-sm text-gray-500 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/60 lg:w-80 dark:bg-gray-800 dark:text-gray-400 dark:focus-within:bg-gray-900">
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search product…"
          aria-label="Search product"
          className="w-full bg-transparent text-foreground outline-none placeholder:text-gray-400"
        />
      </label>
    </form>
  );
}

export function AdminHeader({ email }: { email: string }) {
  const { theme, toggle } = useAdminTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-white/90 px-4 backdrop-blur sm:px-6 dark:bg-gray-900/90 dark:border-gray-800">
      {/* Mobile nav */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Menu />
      </Button>
      {/* Desktop sidebar collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden text-gray-500 lg:inline-flex"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>

      <HeaderSearch />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 border-white/10 bg-[#1b283b] p-0 text-gray-200 [&_[data-slot=button]]:text-gray-300 [&_[data-slot=button]:hover]:bg-white/10 [&_[data-slot=button]:hover]:text-white"
        >
          <SheetHeader className="border-b border-white/10 p-4">
            <SheetTitle>
              <SidebarLogo />
            </SheetTitle>
            <SheetDescription className="sr-only">Admin navigation</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="border-t border-white/10 p-4">
            <p className="truncate pb-2 text-xs text-gray-400" title={email}>
              {email}
            </p>
            <SidebarFooterLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="text-gray-500"
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

        <Separator orientation="vertical" className="mr-1 h-5 self-center" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Account menu"
              className="rounded-full"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {email.slice(0, 1).toUpperCase()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">
              <span className="text-muted-foreground">Signed in as</span>
              <p className="truncate font-semibold text-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" target="_blank">
                <ExternalLink aria-hidden />
                View Store
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem asChild>
                <button
                  type="submit"
                  className="w-full text-red-600 focus:bg-red-600/10 focus:text-red-600 dark:text-red-400"
                >
                  <LogOut aria-hidden />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
