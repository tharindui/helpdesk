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
export type TicketFilterParams = { status?: TicketStatus; category?: TicketCategory; search?: string };

export const ticketsApi = {
  list: (sort?: TicketSortParams, filters?: TicketFilterParams) =>
    api.get<Ticket[]>("/api/tickets", { params: { ...sort, ...filters } }).then((r) => r.data),
};
