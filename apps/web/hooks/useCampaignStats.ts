import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useCampaignStats(campaignId: string) {
  const { data, error, mutate } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}/stats` : null,
    fetcher,
    { refreshInterval: 3000 } // poll every 3s while campaign is running
  );
  return { data: data?.data, error, mutate };
}
