"use client";

import * as React from "react";

type AdminTheme = "light" | "dark";

const STORAGE_KEY = "sunvolt-admin-theme";
const CHANGE_EVENT = "sunvolt-admin-theme-change";

const AdminThemeContext = React.createContext<{
  theme: AdminTheme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

function currentTheme(): AdminTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/**
 * Dark mode for the admin panel only. The `dark` class is applied to
 * <html> so portaled content (dropdowns, sheets) inherits the dark token
 * set, and it is removed again when the admin shell unmounts so the
 * public site always renders light. The preference persists in
 * localStorage; React reads it through useSyncExternalStore.
 */
export function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "dark") {
      document.documentElement.classList.add("dark");
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const theme = React.useSyncExternalStore(
    subscribe,
    currentTheme,
    () => "light" as AdminTheme,
  );

  const toggle = React.useCallback(() => {
    const next: AdminTheme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return React.useContext(AdminThemeContext);
}
