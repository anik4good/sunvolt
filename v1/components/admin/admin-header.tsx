"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
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

export function AdminHeader({ email }: { email: string }) {
  const { theme, toggle } = useAdminTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
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
        className="hidden text-muted-foreground lg:inline-flex"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>
              <SidebarLogo />
            </SheetTitle>
            <SheetDescription className="sr-only">Admin navigation</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="border-t p-4">
            <p className="truncate pb-2 text-xs text-muted-foreground" title={email}>
              {email}
            </p>
            <SidebarFooterLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="text-muted-foreground"
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
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
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
                View Website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem asChild>
                <button
                  type="submit"
                  className="w-full text-destructive focus:bg-destructive/10 focus:text-destructive"
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
