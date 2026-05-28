import { useQuery } from "@tanstack/react-query";
import { ticketsApi } from "./ticketsApi";

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: ticketsApi.list,
  });
}
