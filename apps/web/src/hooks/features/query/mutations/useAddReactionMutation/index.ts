import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addReaction, type ReactionParams } from "@/lib/data/reactions";
import { queryKeys } from "@/hooks/features/query/keys";

/** 반응 누름 (PUT /articles/{articleId}/reactions/{type}, 멱등). 성공 시 기사 상세 무효화. */
export function useAddReactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: ReactionParams) => addReaction(params),
    onSuccess: (_state, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) });
    },
  });
}
