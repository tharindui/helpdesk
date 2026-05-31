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
import { makeTicketDetail, makeReply, SenderType } from "./mocks";
import { renderTicketDetailPage } from "./renders";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

function setupGetMocks({
  ticket = makeTicketDetail(),
  replies = [] as ReturnType<typeof makeReply>[],
  ticketError = false,
} = {}) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === "/api/tickets/1") {
      if (ticketError) return Promise.reject(new Error("Not found"));
      return Promise.resolve({ data: ticket });
    }
    if (url === "/api/users/assignable") return Promise.resolve({ data: [] });
    if (url === "/api/tickets/1/replies") return Promise.resolve({ data: replies });
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

describe("TicketDetailPage", () => {
  describe("loading state", () => {
    it("renders skeletons while the ticket query is pending", () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      renderTicketDetailPage();

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("renders an error message when the ticket cannot be loaded", async () => {
      setupGetMocks({ ticketError: true });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(
          screen.getByText("Ticket not found or could not be loaded.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("ticket data", () => {
    it("renders the ticket subject as a heading", async () => {
      setupGetMocks({ ticket: makeTicketDetail({ subject: "Login is broken" }) });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Login is broken" })
        ).toBeInTheDocument();
      });
    });

    it("renders the sender name and email", async () => {
      setupGetMocks({
        ticket: makeTicketDetail({ fromName: "Bob Jones", fromEmail: "bob@example.com" }),
      });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("Bob Jones")).toBeInTheDocument();
        expect(screen.getByText("<bob@example.com>")).toBeInTheDocument();
      });
    });

    it("renders the ticket body", async () => {
      setupGetMocks({ ticket: makeTicketDetail({ body: "My order is missing." }) });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("My order is missing.")).toBeInTheDocument();
      });
    });
  });

  describe("replies", () => {
    it("shows 'No replies yet' when there are no replies", async () => {
      setupGetMocks({ replies: [] });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("No replies yet")).toBeInTheDocument();
      });
    });

    it("shows the reply count when there are replies", async () => {
      setupGetMocks({ replies: [makeReply({ id: 1 }), makeReply({ id: 2 })] });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("Replies (2)")).toBeInTheDocument();
      });
    });

    it("renders agent replies aligned to the right", async () => {
      setupGetMocks({
        replies: [makeReply({ senderType: SenderType.agent, body: "Agent reply here." })],
      });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("Agent reply here.")).toBeInTheDocument();
      });

      const wrapper = screen.getByText("Agent reply here.").closest(".flex");
      expect(wrapper).toHaveClass("justify-end");
    });

    it("renders customer replies aligned to the left", async () => {
      setupGetMocks({
        replies: [
          makeReply({ senderType: SenderType.customer, author: null, body: "Customer reply here." }),
        ],
      });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("Customer reply here.")).toBeInTheDocument();
      });

      const wrapper = screen.getByText("Customer reply here.").closest(".flex");
      expect(wrapper).toHaveClass("justify-start");
    });

    it("shows the author name for agent replies", async () => {
      setupGetMocks({
        replies: [
          makeReply({ senderType: SenderType.agent, author: { id: "u1", name: "Alice Smith" } }),
        ],
      });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      });
    });

    it("shows 'Customer' for customer replies", async () => {
      setupGetMocks({
        replies: [makeReply({ senderType: SenderType.customer, author: null })],
      });

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByText("Customer")).toBeInTheDocument();
      });
    });
  });

  describe("reply form", () => {
    it("disables the Send reply button when the textarea is empty", async () => {
      setupGetMocks();

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
      });
    });

    it("calls the create reply API with the submitted body", async () => {
      setupGetMocks();
      vi.mocked(api.post).mockResolvedValue({ data: makeReply({ body: "Hello there" }) });
      const user = userEvent.setup();

      renderTicketDetailPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Type your reply...")).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText("Type your reply..."), "Hello there");
      await user.click(screen.getByRole("button", { name: "Send reply" }));

      await waitFor(() => {
        expect(vi.mocked(api.post)).toHaveBeenCalledWith(
          "/api/tickets/1/replies",
          { body: "Hello there" }
        );
      });
    });
  });
});
