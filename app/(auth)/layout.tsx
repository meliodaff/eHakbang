/**
 * Minimal centered shell for login/register/terms — same mobile-first
 * max-w-md frame as AppShell, but without the bottom tab bar (there's no
 * signed-in app chrome to navigate yet).
 */
export default function AuthGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      {children}
    </div>
  );
}
