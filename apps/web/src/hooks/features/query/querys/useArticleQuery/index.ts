import { useQuery } from "@tanstack/react-query";
import { getArticle } from "@/lib/data/articles";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseArticleQueryProps {
  articleId: string;
}

/** 기사 상세 (GET /articles/{articleId}). */
export function useArticleQuery({ articleId }: UseArticleQueryProps) {
  return useQuery({
    queryKey: queryKeys.article(articleId),
    queryFn: () => getArticle({ articleId }),
    enabled: Boolean(articleId),
  });
}
