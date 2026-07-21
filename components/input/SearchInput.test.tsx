import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "./SearchInput";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("SearchInput", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("keeps the generate button disabled until there is input", () => {
    render(<SearchInput />);
    expect(
      screen.getByRole("button", { name: /generate my journey/i }),
    ).toBeDisabled();
  });

  it("does not show suggestions below the character threshold", () => {
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "ka" },
    });
    expect(screen.queryByLabelText(/mga mungkahi/i)).not.toBeInTheDocument();
  });

  it("surfaces matching suggestions after 3+ characters", () => {
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "married" },
    });
    expect(screen.getByLabelText(/mga mungkahi/i)).toBeInTheDocument();
    expect(screen.getByText(/got married/i)).toBeInTheDocument();
  });

  it("navigates to the journey route on submit", () => {
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "I lost my job" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /generate my journey/i }),
    );
    expect(push).toHaveBeenCalledWith("/journey");
  });
});
