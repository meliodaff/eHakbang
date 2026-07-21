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
    expect(screen.getByRole("button", { name: /account/i })).toBeInTheDocument();
  });

  it("always exposes the E-Hakbang launcher FAB", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomTabBar />);
    expect(
      screen.getByRole("link", { name: /open e-hakbang/i }),
    ).toHaveAttribute("href", "/ehakbang");
  });

  it("shows functional E-Hakbang tabs inside the service", () => {
    mockUsePathname.mockReturnValue("/journey");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /my journeys/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
  });

  it("marks My Journeys active on the /journeys route", () => {
    mockUsePathname.mockReturnValue("/journeys");
    render(<BottomTabBar />);
    expect(
      screen.getByRole("link", { name: /my journeys/i }),
    ).toHaveAttribute("aria-current", "page");
  });
});
