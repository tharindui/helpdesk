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
import { makeTicket, makeTicketPage, TicketStatus, TicketCategory } from "./mocks";
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
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([]) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("No tickets yet.")).toBeInTheDocument();
      });
    });

    it("shows '0 tickets' in the subtitle", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([]) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("0 tickets")).toBeInTheDocument();
      });
    });
  });

  describe("populated table", () => {
    it("renders the page heading", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket()]) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
      });
    });

    it("renders subject, sender name and email for each ticket", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: makeTicketPage([
          makeTicket({ id: 1, subject: "Login broken", fromName: "Alice", fromEmail: "alice@example.com" }),
          makeTicket({ id: 2, subject: "Refund request", fromName: "Bob", fromEmail: "bob@example.com" }),
        ]),
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
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket({ status: TicketStatus.open })]) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Open")).toBeInTheDocument();
      });
    });

    it("renders a Resolved badge for resolved tickets", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket({ status: TicketStatus.resolved })]) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Resolved")).toBeInTheDocument();
      });
    });

    it("renders a Closed badge for closed tickets", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket({ status: TicketStatus.closed })]) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Closed")).toBeInTheDocument();
      });
    });

    it("renders '—' when a ticket has no category", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket({ category: null })]) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("—")).toBeInTheDocument();
      });
    });

    it("renders category badges for tickets that have a category", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: makeTicketPage([
          makeTicket({ id: 1, category: TicketCategory.general_question }),
          makeTicket({ id: 2, category: TicketCategory.technical_question }),
          makeTicket({ id: 3, category: TicketCategory.refund_request }),
        ]),
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
        data: makeTicketPage([makeTicket({ createdAt: "2024-03-10T09:00:00.000Z" })]),
      });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Mar 10, 2024")).toBeInTheDocument();
      });
    });

    it("renders tickets in the order returned by the API", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: makeTicketPage([
          makeTicket({ id: 1, subject: "Newest ticket" }),
          makeTicket({ id: 2, subject: "Older ticket" }),
        ]),
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
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket()], 1) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("1 ticket")).toBeInTheDocument();
      });
    });

    it("shows the total count from the server in the subtitle", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: makeTicketPage([makeTicket({ id: 1 }), makeTicket({ id: 2 })], 47),
      });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("47 tickets")).toBeInTheDocument();
      });
    });
  });

  describe("pagination", () => {
    it("does not render pagination controls when all tickets fit on one page", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket()], 1) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
      });
    });

    it("renders Previous and Next buttons when there are multiple pages", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket()], 25) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
      });
    });

    it("disables the Previous button on the first page", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket()], 25) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
      });
    });

    it("shows the correct page indicator", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket()], 25) });

      renderTicketsPage();

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
      });
    });

    it("advances to the next page when Next is clicked", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([makeTicket()], 25) });
      const user = userEvent.setup();

      renderTicketsPage();

      await waitFor(() => screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/tickets", {
          params: expect.objectContaining({ page: 2 }),
        });
      });
    });
  });

  describe("filter bar", () => {
    it("renders the search input", () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      renderTicketsPage();

      expect(screen.getByPlaceholderText(/search by subject/i)).toBeInTheDocument();
    });

    it("renders Status and Category dropdowns", () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      renderTicketsPage();

      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes).toHaveLength(2);
    });

    it("calls the API with status param when a status is selected", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([]) });
      const user = userEvent.setup();

      renderTicketsPage();

      const [statusCombobox] = screen.getAllByRole("combobox");
      await user.click(statusCombobox);
      await user.click(screen.getByRole("option", { name: "Open" }));

      await waitFor(() => {
        expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/tickets", {
          params: expect.objectContaining({ status: TicketStatus.open }),
        });
      });
    });

    it("calls the API with category param when a category is selected", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([]) });
      const user = userEvent.setup();

      renderTicketsPage();

      const [, categoryCombobox] = screen.getAllByRole("combobox");
      await user.click(categoryCombobox);
      await user.click(screen.getByRole("option", { name: "Technical" }));

      await waitFor(() => {
        expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/tickets", {
          params: expect.objectContaining({ category: TicketCategory.technical_question }),
        });
      });
    });

    it("calls the API with search param after the user types", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([]) });
      const user = userEvent.setup();

      renderTicketsPage();

      await user.type(screen.getByPlaceholderText(/search by subject/i), "login");

      await waitFor(
        () => {
          expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/tickets", {
            params: expect.objectContaining({ search: "login" }),
          });
        },
        { timeout: 2000 },
      );
    });

    it("shows 'No tickets match your filters.' when a status filter is active and no tickets match", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([]) });
      const user = userEvent.setup();

      renderTicketsPage();

      const [statusCombobox] = screen.getAllByRole("combobox");
      await user.click(statusCombobox);
      await user.click(screen.getByRole("option", { name: "Resolved" }));

      await waitFor(() => {
        expect(screen.getByText("No tickets match your filters.")).toBeInTheDocument();
      });
    });

    it("shows 'No tickets match your filters.' when a category filter is active and no tickets match", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: makeTicketPage([]) });
      const user = userEvent.setup();

      renderTicketsPage();

      const [, categoryCombobox] = screen.getAllByRole("combobox");
      await user.click(categoryCombobox);
      await user.click(screen.getByRole("option", { name: "Refund" }));

      await waitFor(() => {
        expect(screen.getByText("No tickets match your filters.")).toBeInTheDocument();
      });
    });
  });
});
