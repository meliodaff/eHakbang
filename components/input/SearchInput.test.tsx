import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchInput } from "./SearchInput";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("SearchInput", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
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

  it("blocks submission and skips classification for too-short input", () => {
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "ka" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /generate my journey/i }),
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("routes into the matched preset's flow when classification finds one", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ eventId: "lost-a-job" }),
    });
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "I just became unemployed" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /generate my journey/i }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/journey/confirm?event=lost-a-job"),
    );
  });

  it("falls back to a custom journey when classification finds no match", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ eventId: null }),
    });
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "I am adopting a rescue dog" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /generate my journey/i }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/journey/start?q=I%20am%20adopting%20a%20rescue%20dog",
      ),
    );
  });

  it("blocks submission and shows an error when the text isn't a real life event", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ eventId: null, isLifeEvent: false }),
    });
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "asdkjfhaskjdfh" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /generate my journey/i }),
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });

  it("falls back to a custom journey when classification is unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network error"));
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "I am adopting a rescue dog" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /generate my journey/i }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/journey/start?q=I%20am%20adopting%20a%20rescue%20dog",
      ),
    );
  });

  it("forwards the canonical slug so same-context phrasings resolve to the same journey", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        eventId: null,
        canonicalSlug: "representing-ph-international-tournament",
      }),
    });
    render(<SearchInput />);
    fireEvent.change(screen.getByLabelText(/ilarawan/i), {
      target: { value: "I got accepted as a PH rep for a tournament in the US" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /generate my journey/i }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/journey/start?q=I%20got%20accepted%20as%20a%20PH%20rep%20for%20a%20tournament%20in%20the%20US&slug=representing-ph-international-tournament",
      ),
    );
  });
});
