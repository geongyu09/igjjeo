/**
 * React Query 쿼리 키 팩토리.
 * 키는 데이터 접근 경로와 일치시키고, 방(그룹) 단위 격리를 위해 groupId 등 식별자를 포함한다.
 * mutation의 무효화(invalidateQueries)도 이 팩토리를 참조해 일관성을 유지한다.
 */

export const queryKeys = {
  me: () => ["me"] as const,

  groups: () => ["groups"] as const,
  group: (groupId: string) => ["groups", groupId] as const,
  groupMembers: (groupId: string) => ["groups", groupId, "members"] as const,
  feed: (groupId: string) => ["groups", groupId, "feed"] as const,
  dailyPrompt: (groupId: string, date?: string) =>
    ["groups", groupId, "daily-prompt", date ?? "today"] as const,

  article: (articleId: string) => ["articles", articleId] as const,
  articleComments: (articleId: string) =>
    ["articles", articleId, "comments"] as const,
  articleCorrections: (articleId: string) =>
    ["articles", articleId, "corrections"] as const,

  reportDraft: (reportId: string) => ["reports", reportId, "draft"] as const,
};
