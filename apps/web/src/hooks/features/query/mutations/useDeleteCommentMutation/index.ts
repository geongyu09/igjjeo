import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment } from "@/lib/data/comments";
import { queryKeys } from "@/hooks/features/query/keys";

interface DeleteCommentVariables {
  commentId: string;
  /** 삭제 후 무효화할 기사(댓글 목록·댓글 수). 데이터 호출엔 쓰지 않음. */
  articleId?: string;
}

/** 댓글 삭제 (DELETE /comments/{commentId}, 작성자 본인). */
export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }: DeleteCommentVariables) =>
      deleteComment({ commentId }),
    onSuccess: (_data, { articleId }) => {
      if (!articleId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.articleComments(articleId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) });
    },
  });
}
