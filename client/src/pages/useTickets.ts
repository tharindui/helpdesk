import { useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { ticketsApi } from "./ticketsApi";

export function useTickets(sorting: SortingState) {
  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortDir: "asc" | "desc" = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : "desc";

  return useQuery({
    queryKey: ["tickets", sortBy, sortDir],
    queryFn: () => ticketsApi.list({ sortBy, sortDir }),
  });
}
