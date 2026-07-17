import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeReaction, type ReactionParams } from "@/lib/data/reactions";
import { queryKeys } from "@/hooks/features/query/keys";

/** 반응 취소 (DELETE /articles/{articleId}/reactions/{type}, 멱등). 성공 시 기사 상세 무효화. */
export function useRemoveReactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: ReactionParams) => removeReaction(params),
    onSuccess: (_state, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) });
    },
  });
}
