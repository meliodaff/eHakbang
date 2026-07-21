import { BottomTabBar } from "./BottomTabBar";

/**
 * AppShell renders the app inside a centered, mobile-first frame (max-w-md).
 * On desktop it appears as a phone-width column on the grey app background,
 * with a fixed bottom tab bar for primary navigation.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background shadow-sm">
      {/* Content area — bottom padding clears the fixed tab bar. */}
      <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomTabBar />
    </div>
  );
}
