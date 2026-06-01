import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboardApi";

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.getStats });
}
