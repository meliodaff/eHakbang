import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomTabBar } from "./BottomTabBar";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("BottomTabBar", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it("shows eGov host chrome on the home route", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Representative host tabs are present (as demo buttons).
    expect(screen.getByRole("button", { name: /scan qr/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /history/i })).toBeInTheDocument();
    // Account is a real, functional link (wired to /account).
    expect(screen.getByRole("link", { name: /account/i })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("links the Digital ID FAB to the ID wallet on the home route", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomTabBar />);
    expect(
      screen.getByRole("link", { name: /open my id wallet/i }),
    ).toHaveAttribute("href", "/wallet");
  });

  it("exposes the eHakbang launcher FAB inside the service", () => {
    mockUsePathname.mockReturnValue("/journey");
    render(<BottomTabBar />);
    expect(
      screen.getByRole("link", { name: /open ehakbang/i }),
    ).toHaveAttribute("href", "/ehakbang");
  });

  it("shows functional eHakbang tabs inside the service", () => {
    mockUsePathname.mockReturnValue("/journey");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /my journeys/i }),
    ).toBeInTheDocument();
  });

  it("marks My Journeys active on the /journeys route", () => {
    mockUsePathname.mockReturnValue("/journeys");
    render(<BottomTabBar />);
    expect(
      screen.getByRole("link", { name: /my journeys/i }),
    ).toHaveAttribute("aria-current", "page");
  });
});
