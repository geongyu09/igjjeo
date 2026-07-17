import { useMutation } from "@tanstack/react-query";
import { createReport, type CreateReportParams } from "@/lib/data/reports";

/**
 * 제보 생성 + 각색 (POST /groups/{groupId}/reports).
 * 반환된 draft_articles는 발행 확인 화면에서 사용하고, 발행은 usePublishReportMutation으로 이어진다.
 * (아직 articles에 미저장이므로 피드 무효화는 발행 시점에 한다.)
 */
export function useCreateReportMutation() {
  return useMutation({
    mutationFn: (params: CreateReportParams) => createReport(params),
  });
}
