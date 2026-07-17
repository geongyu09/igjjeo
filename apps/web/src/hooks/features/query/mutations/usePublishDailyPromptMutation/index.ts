import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  publishDailyPrompt,
  type PublishDailyPromptParams,
} from "@/lib/data/dailyPrompts";
import { queryKeys } from "@/hooks/features/query/keys";

/**
 * 데일리 프롬프트 발행 (POST /groups/{groupId}/daily-prompts/{promptId}/publish).
 * 모인 답변을 제보로 전환·각색·발행. 성공 시 방 피드와 프롬프트 상태를 무효화한다.
 */
export function usePublishDailyPromptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: PublishDailyPromptParams) =>
      publishDailyPrompt(params),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed(groupId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dailyPromptScope(groupId),
      });
    },
  });
}
