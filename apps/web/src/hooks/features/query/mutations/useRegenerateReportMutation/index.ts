import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  regenerateReport,
  type RegenerateReportParams,
} from "@/lib/data/reports";
import { queryKeys } from "@/hooks/features/query/keys";

/** 초안 재생성 (POST /reports/{reportId}/regenerate). 성공 시 해당 초안 캐시 갱신. */
export function useRegenerateReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: RegenerateReportParams) => regenerateReport(params),
    onSuccess: (draft, { reportId }) => {
      queryClient.setQueryData(queryKeys.reportDraft(reportId), draft);
    },
  });
}
