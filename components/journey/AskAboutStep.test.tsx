import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AskAboutStep } from "./AskAboutStep";
import type { JourneyStep } from "@/lib/types";

const { askAboutStep } = vi.hoisted(() => ({ askAboutStep: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ askAboutStep }));

const step: JourneyStep = {
  step_number: 1,
  agency_name: "Philippine Statistics Authority",
  agency_code: "PSA",
  step_title: "Register your baby's birth",
  step_type: "record_update",
  reason: "You need an official birth certificate.",
  documents_required: ["Certificate of Live Birth"],
  estimated_time: "1–2 weeks",
  important_note: null,
  egov_service_name: "PSA Birth Registration",
  egov_search_term: "PSA birth registration",
};

function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: /ask about this step/i }));
}

describe("AskAboutStep", () => {
  beforeEach(() => {
    askAboutStep.mockReset();
  });

  it("keeps Send disabled until a question is typed", () => {
    render(<AskAboutStep step={step} />);
    openPanel();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Kailangan ba ito?" } });
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });

  it("calls askAboutStep with the question, language, and step context, and renders the answer", async () => {
    askAboutStep.mockResolvedValue({ answer: "Bring the certificate and a valid ID." });
    render(<AskAboutStep step={step} />);
    openPanel();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "What do I bring?" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(askAboutStep).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "What do I bring?",
        language: "en",
        step: expect.objectContaining({ step_title: step.step_title }),
      }),
    );

    await waitFor(() =>
      expect(screen.getByText("Bring the certificate and a valid ID.")).toBeInTheDocument(),
    );
  });

  it("shows a loading state while the request is in flight", async () => {
    let resolveFn: (value: { answer: string }) => void = () => {};
    askAboutStep.mockReturnValue(new Promise((resolve) => (resolveFn = resolve)));
    render(<AskAboutStep step={step} />);
    openPanel();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "What do I bring?" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("button", { name: /asking/i })).toBeInTheDocument();
    resolveFn({ answer: "done" });
    await waitFor(() => expect(screen.getByText("done")).toBeInTheDocument());
  });

  it("shows an error and re-enables Send when the request fails", async () => {
    askAboutStep.mockRejectedValue(new Error("network error"));
    render(<AskAboutStep step={step} />);
    openPanel();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "What do I bring?" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /^send$/i })).not.toBeDisabled();
  });

  it("clears the previous answer when the question is edited", async () => {
    askAboutStep.mockResolvedValue({ answer: "First answer." });
    render(<AskAboutStep step={step} />);
    openPanel();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "First question?" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(screen.getByText("First answer.")).toBeInTheDocument());

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Second question?" } });
    expect(screen.queryByText("First answer.")).not.toBeInTheDocument();
  });
});
