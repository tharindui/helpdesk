import { TicketStatus, TicketCategory } from "@helpdesk/core";
import type { User } from "../usersApi";
import type { Ticket } from "../ticketsApi";

export type { User, Ticket };

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

export function makeAxiosError(message: string) {
  return {
    isAxiosError: true,
    response: { data: { error: message } },
  };
}

export { TicketStatus, TicketCategory };
