import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServiceTile } from "./ServiceTile";

describe("ServiceTile", () => {
  it("renders its label and optional badge", () => {
    render(<ServiceTile icon="💼" label="Jobs" badge="New" />);
    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("is a link when href is provided", () => {
    render(<ServiceTile icon="🧭" label="E-Hakbang" href="/ehakbang" />);
    expect(screen.getByRole("link", { name: /e-hakbang/i })).toHaveAttribute(
      "href",
      "/ehakbang",
    );
  });

  it("is non-interactive without href", () => {
    render(<ServiceTile icon="🏛️" label="NGAs" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
