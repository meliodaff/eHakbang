import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DemoDataReset } from "@/components/DemoDataReset";
import { LanguageProvider } from "@/lib/i18n";
import { SERVER_SESSION_ID } from "@/lib/server-session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "eHakbang",
  description:
    "AI-powered government journey planner for Filipino citizens. Get an ordered, personalized checklist of government steps after a life event. Sign in required to use the app.",
  applicationName: "eHakbang",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0038a8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <DemoDataReset serverSessionId={SERVER_SESSION_ID} />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
