import api from "@/lib/axios";
import { type TicketStatus, type TicketCategory } from "@helpdesk/core";

export type Ticket = {
  id: number;
  fromEmail: string;
  fromName: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory | null;
  createdAt: string;
};

export const ticketsApi = {
  list: () => api.get<Ticket[]>("/api/tickets").then((r) => r.data),
};
