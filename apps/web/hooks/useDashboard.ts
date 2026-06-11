import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher);
  return { stats: data?.data, error, isLoading, mutate };
}
