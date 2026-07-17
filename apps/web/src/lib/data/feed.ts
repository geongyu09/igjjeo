/**
 * 피드 데이터 접근 계층 (feed-articles.md) — 핵심 읽기.
 * 같은 제보(report_id)에서 나온 기사들은 한 묶음(FeedBundle)으로 붙여 정렬해 내려온다.
 */

import { apiClient } from "@/lib/api/client";
import type { FeedBundle, Paginated, PageParams } from "@/lib/api/types";

export interface GetFeedParams extends PageParams {
  groupId: string;
}

export async function getFeed({
  groupId,
  ...page
}: GetFeedParams): Promise<Paginated<FeedBundle>> {
  const { data } = await apiClient.get<Paginated<FeedBundle>>(
    `/groups/${groupId}/feed`,
    { params: page },
  );
  return data;
}
