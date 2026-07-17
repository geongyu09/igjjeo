import { useSuspenseQuery } from "@tanstack/react-query";
import { getArticle } from "@/lib/data/articles";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseArticleSuspenseQueryProps {
  articleId: string;
}

/** 기사 상세 (GET /articles/{articleId}). */
export function useArticleSuspenseQuery({
  articleId,
}: UseArticleSuspenseQueryProps) {
  return useSuspenseQuery({
    queryKey: queryKeys.article(articleId),
    queryFn: () => getArticle({ articleId }),
  });
}
