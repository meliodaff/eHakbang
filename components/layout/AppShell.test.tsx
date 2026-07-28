import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";

let pathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("AppShell", () => {
  it("shows the bottom nav on the eGov host route", () => {
    pathname = "/";
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  });

  it("shows the bottom nav on the eHakbang dashboard", () => {
    pathname = "/ehakbang";
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  });

  it("shows the bottom nav on the journey checklist page", () => {
    pathname = "/journey";
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  });

  it("hides the bottom nav on focused sub-flows (e.g. the intake gate)", () => {
    pathname = "/journey/start";
    render(<AppShell>content</AppShell>);
    expect(screen.queryByRole("navigation", { name: /primary/i })).not.toBeInTheDocument();
  });

  it("hides the bottom nav on My Journeys", () => {
    pathname = "/journeys";
    render(<AppShell>content</AppShell>);
    expect(screen.queryByRole("navigation", { name: /primary/i })).not.toBeInTheDocument();
  });
});
