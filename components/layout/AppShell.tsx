"use client";

import { usePathname } from "next/navigation";
import { BottomTabBar } from "./BottomTabBar";

/**
 * AppShell renders the app inside a centered, mobile-first frame (max-w-md).
 * On desktop it appears as a phone-width column on the grey app background,
 * with a fixed bottom tab bar for primary navigation (only on main screens).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const showNav = pathname === "/" || pathname === "/ehakbang" || pathname === "/journey";

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background shadow-sm">
      {/* Content area — bottom padding clears the fixed tab bar only when shown. */}
      <div
        className={
          showNav
            ? "flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
            : "flex flex-1 flex-col"
        }
      >
        {children}
      </div>
      {showNav && <BottomTabBar />}
    </div>
  );
}
