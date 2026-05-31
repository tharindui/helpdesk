import api from "@/lib/axios";
import { type TicketStatus, type TicketCategory, type SenderType } from "@helpdesk/core";

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
  bodyHTML: string | null;
  assignedTo: { id: string; name: string } | null;
};

export type TicketPageResult = {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

export type Reply = {
  id: number;
  body: string;
  bodyHTML: string | null;
  senderType: SenderType;
  createdAt: string;
  author: { id: string; name: string } | null;
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
  update: (id: number, data: { assignedToId?: string | null; status?: TicketStatus; category?: TicketCategory | null }) =>
    api.patch<TicketDetail>(`/api/tickets/${id}`, data).then((r) => r.data),
  listReplies: (ticketId: number) =>
    api.get<Reply[]>(`/api/tickets/${ticketId}/replies`).then((r) => r.data),
  createReply: (ticketId: number, body: string) =>
    api.post<Reply>(`/api/tickets/${ticketId}/replies`, { body }).then((r) => r.data),
  polishReply: (ticketId: number, body: string) =>
    api.post<{ polished: string; aiSuggestion: string }>(`/api/tickets/${ticketId}/polish-reply`, { body }).then((r) => r.data),
};
