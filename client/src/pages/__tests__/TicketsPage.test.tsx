import { screen, waitFor } from "@testing-library/react";
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
import { makeTicket } from "./mocks";
import { renderTicketsPage } from "./renders";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("TicketsPage", () => {
  describe("loading state", () => {
    it("renders skeleton rows while the query is pending", () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      renderTicketsPage();

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.getByRole("columnheader", { name: "Subject" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "From" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Category" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Received" })).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders an error message when the query fails", async () => {
      vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
      });
    });
  });

  describe("empty state", () => {
    it("renders an empty-state message when no tickets are returned", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("No tickets yet.")).toBeInTheDocument();
      });
    });

    it("shows '0 tickets' in the subtitle", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("0 tickets")).toBeInTheDocument();
      });
    });
  });

  describe("populated table", () => {
    it("renders the page heading", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [makeTicket()] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
      });
    });

    it("renders subject, sender name and email for each ticket", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          makeTicket({ id: 1, subject: "Login broken", fromName: "Alice", fromEmail: "alice@example.com" }),
          makeTicket({ id: 2, subject: "Refund request", fromName: "Bob", fromEmail: "bob@example.com" }),
        ],
      });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Login broken")).toBeInTheDocument();
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
        expect(screen.getByText("Refund request")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("bob@example.com")).toBeInTheDocument();
      });
    });

    it("renders an Open badge for open tickets", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [makeTicket({ status: "open" })] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Open")).toBeInTheDocument();
      });
    });

    it("renders a Resolved badge for resolved tickets", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [makeTicket({ status: "resolved" })] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Resolved")).toBeInTheDocument();
      });
    });

    it("renders a Closed badge for closed tickets", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [makeTicket({ status: "closed" })] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Closed")).toBeInTheDocument();
      });
    });

    it("renders '—' when a ticket has no category", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [makeTicket({ category: null })] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("—")).toBeInTheDocument();
      });
    });

    it("renders category badges for tickets that have a category", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          makeTicket({ id: 1, category: "general_question" }),
          makeTicket({ id: 2, category: "technical_question" }),
          makeTicket({ id: 3, category: "refund_request" }),
        ],
      });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("General")).toBeInTheDocument();
        expect(screen.getByText("Technical")).toBeInTheDocument();
        expect(screen.getByText("Refund")).toBeInTheDocument();
      });
    });

    it("formats the Received date as 'Mar 10, 2024'", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [makeTicket({ createdAt: "2024-03-10T09:00:00.000Z" })],
      });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Mar 10, 2024")).toBeInTheDocument();
      });
    });

    it("renders tickets in the order returned by the API", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          makeTicket({ id: 1, subject: "Newest ticket" }),
          makeTicket({ id: 2, subject: "Older ticket" }),
        ],
      });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Newest ticket")).toBeInTheDocument();
        expect(screen.getByText("Older ticket")).toBeInTheDocument();
      });

      const rows = screen.getAllByRole("row");
      const newestIdx = rows.findIndex((r) => r.textContent?.includes("Newest ticket"));
      const olderIdx = rows.findIndex((r) => r.textContent?.includes("Older ticket"));
      expect(newestIdx).toBeLessThan(olderIdx);
    });

    it("shows '1 ticket' singular when there is exactly one ticket", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [makeTicket()] });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("1 ticket")).toBeInTheDocument();
      });
    });

    it("shows correct plural count in the subtitle", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [makeTicket({ id: 1 }), makeTicket({ id: 2 }), makeTicket({ id: 3 })],
      });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("3 tickets")).toBeInTheDocument();
      });
    });
  });
});
