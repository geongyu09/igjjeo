import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactionCounts } from "@/lib/api/types";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate, isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: true }),
}));

// 브라우저(네이티브 셸 아님) 경로 검증 — bridge는 no-op으로 고정한다.
vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request: vi.fn() }),
}));

vi.mock("@/components/common/shared/SessionProvider", () => ({
  useSession: () => ({
    me: { display_name: "나", masked_name: "나*나" },
    groups: [{ id: "g1", name: "3조 뉴스룸", member_count: 9 }],
    activeGroupId: "g1",
  }),
}));

const zeroReactions: ReactionCounts = {
  really: 0,
  shock: 0,
  admit: 0,
  scoop: 0,
};

function feedArticle(id: string, headline: string) {
  return {
    id,
    outlet_key: "shock" as const,
    headline,
    excerpt: "발췌",
    reporter_name: "충격 기자",
    published_at: "2026-07-17T10:00:00Z",
    is_correction: false,
    reaction_counts: zeroReactions,
    comment_count: 3,
    my_reactions: [],
  };
}

const { useFeedSuspenseQuery } = vi.hoisted(() => ({
  useFeedSuspenseQuery: vi.fn(),
}));
vi.mock("@/hooks/features/query/suspenseQuerys/useFeedSuspenseQuery", () => ({
  useFeedSuspenseQuery,
}));

import FeedPage from "./page";

function mockFeed() {
  useFeedSuspenseQuery.mockReturnValue({
    data: {
      pages: [
        {
          items: [
            {
              report_id: "r1",
              reporter: { masked_name: "김*규" },
              articles: [
                feedArticle("1", "【단독】 상습 지각, 이대로 괜찮은가"),
                feedArticle("2", "간식 예산 40% 삭감… 긴축 국면 진입"),
              ],
            },
          ],
          next_cursor: null,
        },
      ],
    },
  });
}

describe("FeedPage", () => {
  it("톱기사와 언론사 카드를 렌더링한다", () => {
    mockFeed();
    render(<FeedPage />);
    expect(
      screen.getByText("【단독】 상습 지각, 이대로 괜찮은가"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("간식 예산 40% 삭감… 긴축 국면 진입"),
    ).toBeInTheDocument();
  });

  it("톱기사를 누르면 해당 기사 상세로 전환한다", async () => {
    mockFeed();
    navigate.mockClear();
    render(<FeedPage />);
    await userEvent.click(
      screen.getByText("【단독】 상습 지각, 이대로 괜찮은가"),
    );
    expect(navigate).toHaveBeenCalledWith({
      href: "/article/1",
      animation: "slide",
    });
  });
});
