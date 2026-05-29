import { useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { type TicketStatus, type TicketCategory } from "@helpdesk/core";
import { ticketsApi } from "./ticketsApi";

export const PAGE_SIZE = 10;

export type TicketFilters = {
  status: TicketStatus | null;
  category: TicketCategory | null;
  search: string;
};

export function useTickets(sorting: SortingState, filters: TicketFilters, page: number) {
  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortDir: "asc" | "desc" = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : "desc";

  return useQuery({
    queryKey: ["tickets", sortBy, sortDir, filters.status, filters.category, filters.search, page],
    queryFn: () =>
      ticketsApi.list(
        { sortBy, sortDir },
        {
          status: filters.status ?? undefined,
          category: filters.category ?? undefined,
          search: filters.search || undefined,
        },
        { page, pageSize: PAGE_SIZE },
      ),
  });
}
