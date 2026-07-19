import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refillReportQuota } from "@/lib/data/reports";
import { queryKeys } from "@/hooks/features/query/keys";

/**
 * 오늘 제보 한도 충전 (POST /me/report-quota/refill).
 * 서버가 갱신된 한도를 그대로 돌려주므로 캐시에 심고, 무효화로 재검증까지 건다
 * (제보 화면의 남은 횟수 안내가 같은 키를 본다).
 */
export function useRefillReportQuotaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refillReportQuota(),
    onSuccess: (quota) => {
      queryClient.setQueryData(queryKeys.reportQuota(), quota);
      queryClient.invalidateQueries({ queryKey: queryKeys.reportQuota() });
    },
  });
}
