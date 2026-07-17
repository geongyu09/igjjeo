/**
 * 기사 상세 데이터 접근 계층 (feed-articles.md).
 * 비활성(is_active=false) 기사는 서버가 404로 숨긴다.
 */

import { apiClient } from "@/lib/api/client";
import type { Article } from "@/lib/api/types";

export interface ArticleIdParams {
  articleId: string;
}

export async function getArticle({
  articleId,
}: ArticleIdParams): Promise<Article> {
  const { data } = await apiClient.get<Article>(`/articles/${articleId}`);
  return data;
}

/** 조회수 증가(선택 엔드포인트). 실패해도 화면 흐름을 막지 않도록 별도 호출로 둔다. */
export async function incrementView({
  articleId,
}: ArticleIdParams): Promise<void> {
  await apiClient.post(`/articles/${articleId}/views`);
}
