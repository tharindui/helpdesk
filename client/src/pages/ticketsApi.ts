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

export type TicketDetail = Ticket & {
  body: string;
  assignedTo: { id: string; name: string } | null;
};

export type TicketPageResult = {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

export type TicketSortParams = { sortBy: string; sortDir: "asc" | "desc" };
export type TicketFilterParams = { status?: TicketStatus; category?: TicketCategory; search?: string };
export type TicketPaginationParams = { page: number; pageSize: number };

export const ticketsApi = {
  list: (sort?: TicketSortParams, filters?: TicketFilterParams, pagination?: TicketPaginationParams) =>
    api
      .get<TicketPageResult>("/api/tickets", { params: { ...sort, ...filters, ...pagination } })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<TicketDetail>(`/api/tickets/${id}`).then((r) => r.data),
  assign: (id: number, assignedToId: string | null) =>
    api.patch<TicketDetail>(`/api/tickets/${id}`, { assignedToId }).then((r) => r.data),
};
