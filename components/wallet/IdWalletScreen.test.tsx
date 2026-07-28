import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IdWalletScreen } from "./IdWalletScreen";

const { fetchIdWalletFromSupabase, saveIdWalletToSupabase } = vi.hoisted(() => ({
  fetchIdWalletFromSupabase: vi.fn(),
  saveIdWalletToSupabase: vi.fn(),
}));
vi.mock("@/lib/id-wallet-sync", () => ({
  fetchIdWalletFromSupabase,
  saveIdWalletToSupabase,
}));

describe("IdWalletScreen", () => {
  beforeEach(() => {
    fetchIdWalletFromSupabase.mockReset().mockResolvedValue([]);
    saveIdWalletToSupabase.mockReset().mockResolvedValue(undefined);
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("hides Save changes until the selection differs from what's saved", async () => {
    render(<IdWalletScreen />);
    await waitFor(() => expect(fetchIdWalletFromSupabase).toHaveBeenCalled());

    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/meron ako ng tin/i));
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();

    // Unchecking back to the saved (empty) state hides it again.
    fireEvent.click(screen.getByLabelText(/meron ako ng tin/i));
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
  });

  it("tapping Save changes persists the held IDs and hides the button", async () => {
    render(<IdWalletScreen />);
    await waitFor(() => expect(fetchIdWalletFromSupabase).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText(/meron ako ng sss/i));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(saveIdWalletToSupabase).toHaveBeenCalledWith(["sss"]));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument(),
    );
  });

  it("shows Save changes immediately when the local wallet already differs from the saved one", async () => {
    window.localStorage.setItem("ehakbang:id-wallet", JSON.stringify(["philhealth"]));
    fetchIdWalletFromSupabase.mockResolvedValue([]);

    render(<IdWalletScreen />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument(),
    );
  });
});
