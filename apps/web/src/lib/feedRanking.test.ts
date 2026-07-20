import { describe, expect, it } from "vitest";
import type { FeedArticle, FeedBundle, ReactionCounts } from "@/lib/api/types";
import {
  heatScore,
  isFreshArticle,
  rankFeed,
  toFeedItems,
  type FeedItem,
} from "./feedRanking";

const NOW = new Date("2026-07-20T12:00:00Z");

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function reactions(partial: Partial<ReactionCounts> = {}): ReactionCounts {
  return { really: 0, shock: 0, admit: 0, scoop: 0, ...partial };
}

function article(
  id: string,
  overrides: Partial<FeedArticle> = {},
): FeedArticle {
  return {
    id,
    outlet_key: "shock",
    headline: `헤드라인 ${id}`,
    excerpt: "발췌",
    reporter_name: "충격 기자",
    published_at: hoursAgo(1),
    is_correction: false,
    reaction_counts: reactions(),
    comment_count: 0,
    my_reactions: [],
    ...overrides,
  };
}

function item(a: FeedArticle, reporterLabel = "김*규"): FeedItem {
  return { article: a, reporterLabel };
}

describe("toFeedItems", () => {
  it("제보 묶음을 기사 단위로 펼치고 제보자 라벨을 실어 준다", () => {
    const bundles: FeedBundle[] = [
      {
        report_id: "r1",
        reporter: { masked_name: "김*규" },
        articles: [article("1"), article("2")],
      },
      {
        report_id: "r2",
        reporter: { masked_name: "이*아" },
        articles: [article("3")],
      },
    ];

    expect(toFeedItems(bundles)).toEqual([
      { article: bundles[0].articles[0], reporterLabel: "김*규" },
      { article: bundles[0].articles[1], reporterLabel: "김*규" },
      { article: bundles[1].articles[0], reporterLabel: "이*아" },
    ]);
  });
});

describe("heatScore", () => {
  it("반응 합계와 댓글 수를 더한다", () => {
    expect(
      heatScore(
        article("1", {
          reaction_counts: reactions({ really: 3, shock: 2 }),
          comment_count: 4,
        }),
      ),
    ).toBe(9);
  });
});

describe("rankFeed", () => {
  it("24시간 안에서 가장 뜨거운 기사를 톱기사로 올린다", () => {
    const hot = article("hot", {
      published_at: hoursAgo(20),
      reaction_counts: reactions({ really: 5 }),
    });
    const recent = article("recent", { published_at: hoursAgo(1) });

    const { hero, isHeroHot } = rankFeed([item(recent), item(hot)], NOW);

    expect(hero?.article.id).toBe("hot");
    expect(isHeroHot).toBe(true);
  });

  it("24시간이 지난 기사는 아무리 뜨거워도 톱기사로 뽑지 않는다", () => {
    const old = article("old", {
      published_at: hoursAgo(30),
      reaction_counts: reactions({ really: 99 }),
    });
    const recent = article("recent", {
      published_at: hoursAgo(2),
      reaction_counts: reactions({ really: 1 }),
    });

    const { hero, isHeroHot } = rankFeed([item(old), item(recent)], NOW);

    expect(hero?.article.id).toBe("recent");
    expect(isHeroHot).toBe(true);
  });

  it("톱기사를 뺀 나머지는 최신순으로 정렬한다", () => {
    const a = article("a", { published_at: hoursAgo(3) });
    const b = article("b", { published_at: hoursAgo(10) });
    const c = article("c", { published_at: hoursAgo(1) });
    const hot = article("hot", {
      published_at: hoursAgo(5),
      reaction_counts: reactions({ shock: 7 }),
    });

    const { hero, rest } = rankFeed(
      [item(a), item(b), item(c), item(hot)],
      NOW,
    );

    expect(hero?.article.id).toBe("hot");
    expect(rest.map(({ article: it }) => it.id)).toEqual(["c", "a", "b"]);
  });

  it("반응이 아무 데도 없으면 가장 최근 기사를 톱기사로 두되 뜨겁다고 표시하지 않는다", () => {
    const older = article("older", { published_at: hoursAgo(5) });
    const newer = article("newer", { published_at: hoursAgo(1) });

    const { hero, isHeroHot, rest } = rankFeed([item(older), item(newer)], NOW);

    expect(hero?.article.id).toBe("newer");
    expect(isHeroHot).toBe(false);
    expect(rest.map(({ article: it }) => it.id)).toEqual(["older"]);
  });

  it("24시간 안에 기사가 하나도 없으면 가장 최근 기사를 톱기사로 둔다", () => {
    const old = article("old", {
      published_at: hoursAgo(50),
      reaction_counts: reactions({ really: 3 }),
    });
    const older = article("older", {
      published_at: hoursAgo(80),
      reaction_counts: reactions({ really: 9 }),
    });

    const { hero, isHeroHot } = rankFeed([item(old), item(older)], NOW);

    expect(hero?.article.id).toBe("old");
    expect(isHeroHot).toBe(false);
  });

  it("열기가 같으면 더 최근 기사를 톱기사로 뽑는다", () => {
    const earlier = article("earlier", {
      published_at: hoursAgo(8),
      reaction_counts: reactions({ really: 2 }),
    });
    const later = article("later", {
      published_at: hoursAgo(2),
      reaction_counts: reactions({ really: 2 }),
    });

    const { hero } = rankFeed([item(earlier), item(later)], NOW);

    expect(hero?.article.id).toBe("later");
  });

  it("기사가 없으면 톱기사도 없다", () => {
    expect(rankFeed([], NOW)).toEqual({
      hero: null,
      rest: [],
      isHeroHot: false,
    });
  });
});

describe("isFreshArticle", () => {
  it("4시간 안에 올라온 기사면 최신으로 본다", () => {
    expect(isFreshArticle(hoursAgo(3.9), NOW)).toBe(true);
  });

  it("4시간이 지난 기사는 최신이 아니다", () => {
    expect(isFreshArticle(hoursAgo(4), NOW)).toBe(false);
    expect(isFreshArticle(hoursAgo(9), NOW)).toBe(false);
  });

  it("시각을 해석할 수 없으면 최신이 아니다", () => {
    expect(isFreshArticle("이상한 값", NOW)).toBe(false);
  });
});
