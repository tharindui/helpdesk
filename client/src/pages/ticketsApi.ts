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

export type TicketSortParams = { sortBy: string; sortDir: "asc" | "desc" };

export const ticketsApi = {
  list: (sort?: TicketSortParams) =>
    api.get<Ticket[]>("/api/tickets", { params: sort }).then((r) => r.data),
};
