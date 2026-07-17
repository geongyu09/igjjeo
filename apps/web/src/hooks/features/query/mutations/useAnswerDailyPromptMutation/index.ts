import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  answerDailyPrompt,
  type AnswerDailyPromptParams,
} from "@/lib/data/dailyPrompts";
import { queryKeys } from "@/hooks/features/query/keys";

/** 데일리 프롬프트 답변 (POST /groups/{groupId}/daily-prompts/{promptId}/answers). */
export function useAnswerDailyPromptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AnswerDailyPromptParams) => answerDailyPrompt(params),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dailyPromptScope(groupId),
      });
    },
  });
}
