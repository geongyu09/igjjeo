import { useInfiniteQuery } from "@tanstack/react-query";
import { listComments } from "@/lib/data/comments";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseArticleCommentsQueryProps {
  articleId: string;
}

/** 기사 댓글 목록 (GET /articles/{articleId}/comments, 커서 페이지네이션). */
export function useArticleCommentsQuery({
  articleId,
}: UseArticleCommentsQueryProps) {
  return useInfiniteQuery({
    queryKey: queryKeys.articleComments(articleId),
    queryFn: ({ pageParam }) => listComments({ articleId, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: Boolean(articleId),
  });
}
