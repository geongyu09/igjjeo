import { useQuery } from "@tanstack/react-query";
import { getReportDraft } from "@/lib/data/reports";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseReportDraftQueryProps {
  reportId: string;
}

/** 미발행 제보의 현재 초안 재조회 (GET /reports/{reportId}). 발행 확인 화면 새로고침용. */
export function useReportDraftQuery({ reportId }: UseReportDraftQueryProps) {
  return useQuery({
    queryKey: queryKeys.reportDraft(reportId),
    queryFn: () => getReportDraft({ reportId }),
    enabled: Boolean(reportId),
  });
}
