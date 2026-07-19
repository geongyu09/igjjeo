import { useQuery } from "@tanstack/react-query";
import { getReportQuota } from "@/lib/data/reports";
import { queryKeys } from "@/hooks/features/query/keys";

/**
 * 오늘 제보 한도 사용 현황 (GET /me/report-quota).
 * 제보 화면의 보조 안내라 화면을 막지 않도록 suspense 가 아닌 일반 query 로 둔다.
 * 한도는 방과 무관한 사용자 전역 값이라 key 에 groupId 를 포함하지 않는다.
 */
export function useReportQuotaQuery() {
  return useQuery({
    queryKey: queryKeys.reportQuota(),
    queryFn: () => getReportQuota(),
  });
}
