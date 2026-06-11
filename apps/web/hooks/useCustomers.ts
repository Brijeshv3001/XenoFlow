import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useCustomers(params: {
  page?: number;
  search?: string;
  city?: string;
  tag?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "") as [string, string][]
  ).toString();
  const { data, error, isLoading, mutate } = useSWR(`/api/customers?${query}`, fetcher);
  return { data: data?.data, error, isLoading, mutate };
}
