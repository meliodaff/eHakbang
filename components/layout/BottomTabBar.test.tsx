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

  it("renders the three primary tabs", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /my journeys/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
  });

  it("marks Home active on the landing route", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /my journeys/i }),
    ).not.toHaveAttribute("aria-current");
  });

  it("keeps Home active while inside a /journey flow", () => {
    mockUsePathname.mockReturnValue("/journey/complete");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks My Journeys active on the /journeys route", () => {
    mockUsePathname.mockReturnValue("/journeys");
    render(<BottomTabBar />);
    expect(
      screen.getByRole("link", { name: /my journeys/i }),
    ).toHaveAttribute("aria-current", "page");
  });
});
