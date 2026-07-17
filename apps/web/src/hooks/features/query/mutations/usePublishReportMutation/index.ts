import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publishReport, type PublishReportParams } from "@/lib/data/reports";
import { queryKeys } from "@/hooks/features/query/keys";

/**
 * 초안 발행 (POST /reports/{reportId}/publish).
 * 성공 시 발행된 기사의 group_id로 해당 방 피드를 무효화한다.
 */
export function usePublishReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: PublishReportParams) => publishReport(params),
    onSuccess: ({ articles }) => {
      const groupId = articles[0]?.group_id;
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(groupId) });
      }
    },
  });
}
