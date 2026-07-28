import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrackTabs } from "./TrackTabs";

vi.mock("./RequirementsTab", () => ({
  RequirementsTab: ({ journeyId }: { journeyId?: string }) => (
    <div>Requirements content for {journeyId ?? "all"}</div>
  ),
}));
vi.mock("./TrackScreen", () => ({
  TrackScreen: ({ journeyId }: { journeyId?: string }) => (
    <div>Tracking content for {journeyId ?? "all"}</div>
  ),
}));
describe("TrackTabs", () => {
  it("defaults to the Tracking tab", () => {
    render(<TrackTabs journeyId="j1" />);

    expect(screen.getByText("Tracking content for j1")).toBeInTheDocument();
    expect(screen.queryByText(/requirements content/i)).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /tracking/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches to the Requirements tab on click", () => {
    render(<TrackTabs journeyId="j1" />);

    fireEvent.click(screen.getByRole("tab", { name: /requirements/i }));

    expect(screen.getByText("Requirements content for j1")).toBeInTheDocument();
    expect(screen.queryByText(/tracking content/i)).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /requirements/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches back to Tracking on click", () => {
    render(<TrackTabs journeyId="j1" />);

    fireEvent.click(screen.getByRole("tab", { name: /requirements/i }));
    fireEvent.click(screen.getByRole("tab", { name: /tracking/i }));

    expect(screen.getByText("Tracking content for j1")).toBeInTheDocument();
  });
});
