import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EhakbangFeatureCard } from "./EhakbangFeatureCard";

describe("EhakbangFeatureCard", () => {
  it("renders a link that launches the eHakbang service", () => {
    render(<EhakbangFeatureCard />);
    const link = screen.getByRole("link", { name: /ehakbang/i });
    expect(link).toHaveAttribute("href", "/ehakbang");
  });
});
