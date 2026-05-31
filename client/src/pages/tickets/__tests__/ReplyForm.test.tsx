import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "@/lib/axios";
import { renderReplyForm } from "./renders";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("ReplyForm", () => {
  describe("initial state", () => {
    it("disables both buttons when the textarea is empty", () => {
      renderReplyForm();

      expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
    });

    it("enables both buttons when text is typed", async () => {
      const user = userEvent.setup();
      renderReplyForm();

      await user.type(screen.getByPlaceholderText("Type your reply..."), "Hello");

      expect(screen.getByRole("button", { name: "Polish" })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: "Send reply" })).not.toBeDisabled();
    });

    it("shows 'Sending…' on the submit button when isPending is true", () => {
      renderReplyForm({ isPending: true });

      expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    });

    it("shows the send error alert when isError is true", () => {
      renderReplyForm({ isError: true });

      expect(
        screen.getByText("Failed to send reply. Please try again.")
      ).toBeInTheDocument();
    });
  });

  describe("Polish button", () => {
    it("calls the polish API with the correct ticketId and current draft", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { polished: "Polished text", aiSuggestion: "AI suggestion" } });
      const user = userEvent.setup();

      renderReplyForm({ ticketId: 42 });

      await user.type(screen.getByPlaceholderText("Type your reply..."), "raw draft");
      await user.click(screen.getByRole("button", { name: "Polish" }));

      await waitFor(() => {
        expect(vi.mocked(api.post)).toHaveBeenCalledWith(
          "/api/tickets/42/polish-reply",
          { body: "raw draft" }
        );
      });
    });

    it("shows two reply option cards on success", async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { polished: "Polished text", aiSuggestion: "AI suggestion text" },
      });
      const user = userEvent.setup();

      renderReplyForm();

      await user.type(screen.getByPlaceholderText("Type your reply..."), "raw draft");
      await user.click(screen.getByRole("button", { name: "Polish" }));

      await waitFor(() => {
        expect(screen.getByText("Your reply (polished)")).toBeInTheDocument();
        expect(screen.getByText("AI suggestion")).toBeInTheDocument();
        expect(screen.getByText("Polished text")).toBeInTheDocument();
        expect(screen.getByText("AI suggestion text")).toBeInTheDocument();
      });
    });

    it("fills the textarea and hides options when Use this is clicked", async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { polished: "Polished text", aiSuggestion: "AI suggestion text" },
      });
      const user = userEvent.setup();

      renderReplyForm();

      await user.type(screen.getByPlaceholderText("Type your reply..."), "raw draft");
      await user.click(screen.getByRole("button", { name: "Polish" }));

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: "Use this" })).toHaveLength(2);
      });

      await user.click(screen.getAllByRole("button", { name: "Use this" })[0]);

      expect(screen.getByPlaceholderText("Type your reply...")).toHaveValue("Polished text");
      expect(screen.queryByText("Your reply (polished)")).not.toBeInTheDocument();
    });

    it("shows 'Polishing…' and disables both buttons while the request is in flight", async () => {
      vi.mocked(api.post).mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();

      renderReplyForm();

      await user.type(screen.getByPlaceholderText("Type your reply..."), "draft");
      await user.click(screen.getByRole("button", { name: "Polish" }));

      expect(screen.getByRole("button", { name: "Polishing…" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
    });

    it("shows an error alert when polishing fails", async () => {
      vi.mocked(api.post).mockRejectedValue(new Error("Network error"));
      const user = userEvent.setup();

      renderReplyForm();

      await user.type(screen.getByPlaceholderText("Type your reply..."), "draft");
      await user.click(screen.getByRole("button", { name: "Polish" }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to polish reply. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("clears the polish error when a new attempt starts", async () => {
      vi.mocked(api.post)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();

      renderReplyForm();

      await user.type(screen.getByPlaceholderText("Type your reply..."), "draft");
      await user.click(screen.getByRole("button", { name: "Polish" }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to polish reply. Please try again.")
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Polish" }));

      expect(
        screen.queryByText("Failed to polish reply. Please try again.")
      ).not.toBeInTheDocument();
    });
  });

  describe("send reply", () => {
    it("calls onSubmit with the textarea body when the form is submitted", async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      renderReplyForm({ onSubmit });

      await user.type(screen.getByPlaceholderText("Type your reply..."), "My reply");
      await user.click(screen.getByRole("button", { name: "Send reply" }));

      expect(onSubmit).toHaveBeenCalledWith("My reply");
    });
  });
});
