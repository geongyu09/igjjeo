/**
 * 피드 배치 규칙 — 서버가 내려준 제보 묶음을 화면 순서로 재배열한다.
 * 최상단은 24시간 안에서 반응이 가장 뜨거운 기사, 그 아래는 최신순.
 */

import type { FeedArticle, FeedBundle } from "@/lib/api/types";

const HOUR = 60 * 60 * 1000;
/** 톱기사 후보로 볼 수 있는 최대 경과 시간 */
const HOT_WINDOW = 24 * HOUR;
/** "최신 뉴스" 마크를 다는 최대 경과 시간 */
const FRESH_WINDOW = 4 * HOUR;

export interface FeedItem {
  article: FeedArticle;
  /** 제보자 마스킹 이름 ("김*규") */
  reporterLabel: string;
}

export interface RankedFeed {
  /** 최상단 톱기사 — 기사가 없으면 null */
  hero: FeedItem | null;
  /** 톱기사를 뺀 나머지, 최신순 */
  rest: FeedItem[];
  /** 톱기사가 24시간 내 가장 반응이 뜨거운 기사로 뽑힌 것인지 */
  isHeroHot: boolean;
}

/** 제보 묶음(FeedBundle)을 기사 단위 목록으로 펼친다. */
export function toFeedItems(bundles: FeedBundle[]): FeedItem[] {
  return bundles.flatMap((bundle) =>
    bundle.articles.map((article) => ({
      article,
      reporterLabel: bundle.reporter.masked_name,
    })),
  );
}

/** 반응 합계 + 댓글 수 — 기사가 얼마나 뜨거운지의 단일 지표. */
export function heatScore(article: FeedArticle): number {
  const reactions = Object.values(article.reaction_counts).reduce(
    (sum, count) => sum + count,
    0,
  );
  return reactions + article.comment_count;
}

function publishedTime(article: FeedArticle): number {
  const time = new Date(article.published_at).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function byNewest(a: FeedItem, b: FeedItem): number {
  return publishedTime(b.article) - publishedTime(a.article);
}

/** 발행된 지 4시간이 지나지 않은 기사인지. */
export function isFreshArticle(
  publishedAt: string,
  now: Date = new Date(),
): boolean {
  const elapsed = now.getTime() - new Date(publishedAt).getTime();
  if (Number.isNaN(elapsed)) return false;
  return elapsed < FRESH_WINDOW;
}

/**
 * 톱기사 하나 + 최신순 나머지로 나눈다.
 * 24시간 안에 반응이 있는 기사가 없으면 가장 최근 기사를 올리되 "뜨겁다"고 표시하지 않는다.
 */
export function rankFeed(
  items: FeedItem[],
  now: Date = new Date(),
): RankedFeed {
  if (items.length === 0) return { hero: null, rest: [], isHeroHot: false };

  const newestFirst = [...items].sort(byNewest);
  const threshold = now.getTime() - HOT_WINDOW;

  // 최신순으로 훑으며 최고 열기를 고른다 — 동점이면 앞(더 최근)이 이긴다.
  const hot = newestFirst
    .filter(({ article }) => publishedTime(article) >= threshold)
    .reduce<FeedItem | null>((best, candidate) => {
      if (heatScore(candidate.article) === 0) return best;
      if (!best) return candidate;
      return heatScore(candidate.article) > heatScore(best.article)
        ? candidate
        : best;
    }, null);

  const hero = hot ?? newestFirst[0];

  return {
    hero,
    rest: newestFirst.filter((item) => item !== hero),
    isHeroHot: hot !== null,
  };
}
