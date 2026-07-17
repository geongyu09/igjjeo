import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment, type CreateCommentParams } from "@/lib/data/comments";
import { queryKeys } from "@/hooks/features/query/keys";

/** 댓글 작성 (POST /articles/{articleId}/comments). 성공 시 댓글 목록·기사 상세(댓글 수) 무효화. */
export function useCreateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateCommentParams) => createComment(params),
    onSuccess: (_comment, { articleId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.articleComments(articleId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) });
    },
  });
}
