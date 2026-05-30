import { TicketStatus, TicketCategory, SenderType } from "@helpdesk/core";
import type { User } from "../usersApi";
import type { Ticket, TicketDetail, TicketPageResult, Reply } from "../ticketsApi";

export type { User, Ticket, TicketDetail, TicketPageResult, Reply };

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "agent",
    createdAt: "2024-01-15T10:00:00.000Z",
    ...overrides,
  };
}

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    fromEmail: "customer@example.com",
    fromName: "Jane Customer",
    subject: "Help needed",
    status: TicketStatus.open,
    category: null,
    createdAt: "2024-03-10T09:00:00.000Z",
    ...overrides,
  };
}

export function makeTicketDetail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: 1,
    fromEmail: "customer@example.com",
    fromName: "Jane Customer",
    subject: "Help needed",
    status: TicketStatus.open,
    category: null,
    createdAt: "2024-03-10T09:00:00.000Z",
    body: "I need help with my order.",
    assignedTo: null,
    ...overrides,
  };
}

export function makeReply(overrides: Partial<Reply> = {}): Reply {
  return {
    id: 1,
    body: "We are looking into it.",
    senderType: SenderType.agent,
    createdAt: "2024-03-10T10:00:00.000Z",
    author: { id: "user-1", name: "Alice Smith" },
    ...overrides,
  };
}

export function makeAxiosError(message: string) {
  return {
    isAxiosError: true,
    response: { data: { error: message } },
  };
}

export function makeTicketPage(tickets: Ticket[] = [], total?: number): TicketPageResult {
  return { data: tickets, total: total ?? tickets.length, page: 1, pageSize: 10 };
}

export { TicketStatus, TicketCategory, SenderType };
