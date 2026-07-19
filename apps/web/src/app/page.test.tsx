import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactionCounts } from "@/lib/api/types";

const { navigate, replaceScreen, refreshFeed, copyInviteLink } = vi.hoisted(
  () => ({
    navigate: vi.fn(),
    replaceScreen: vi.fn(),
    refreshFeed: vi.fn(() => Promise.resolve()),
    copyInviteLink: vi.fn(),
  }),
);

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate, isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: true }),
}));

// 브라우저(네이티브 셸 아님) 경로 검증 — bridge는 no-op으로 고정한다.
vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request: vi.fn() }),
}));

vi.mock("@/hooks/common/useReplaceScreen", () => ({
  useReplaceScreen: () => replaceScreen,
}));

vi.mock("@/hooks/features/feed/useRefreshFeed", () => ({
  useRefreshFeed: () => refreshFeed,
}));

vi.mock("@/hooks/features/group/useCopyInviteLink", () => ({
  useCopyInviteLink: () => copyInviteLink,
}));

vi.mock("@/components/common/shared/SessionProvider", () => ({
  useSession: () => ({
    me: { display_name: "나", masked_name: "나*나" },
    groups: [
      { id: "g1", name: "3조 뉴스룸", member_count: 9, invite_code: "7K2Q" },
    ],
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
  it("헤더에 로고 대신 방 이름과 인원수만 보여준다", () => {
    mockFeed();
    render(<FeedPage />);
    expect(screen.getByText("3조 뉴스룸")).toBeInTheDocument();
    expect(screen.getByText("9명")).toBeInTheDocument();
    expect(screen.queryByText("이거 진짜에요?")).not.toBeInTheDocument();
  });

  it("헤더 제일 오른쪽에 프로필 대신 방 공유 버튼을 둔다", () => {
    mockFeed();
    render(<FeedPage />);
    expect(screen.getByRole("button", { name: "방 공유" })).toBeInTheDocument();
  });

  it("방 공유 버튼을 누르면 활성 방의 초대 링크를 복사한다", async () => {
    mockFeed();
    copyInviteLink.mockClear();
    render(<FeedPage />);
    await userEvent.click(screen.getByRole("button", { name: "방 공유" }));
    expect(copyInviteLink).toHaveBeenCalledWith("7K2Q");
  });

  it("방 이름을 누르면 방 허브로 화면을 교체한다", async () => {
    mockFeed();
    replaceScreen.mockClear();
    render(<FeedPage />);
    await userEvent.click(screen.getByText("3조 뉴스룸"));
    expect(replaceScreen).toHaveBeenCalledWith("/group");
  });

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

  it("피드 최상단에서 아래로 당기면 피드를 다시 가져온다", () => {
    mockFeed();
    refreshFeed.mockClear();
    render(<FeedPage />);

    const body = screen
      .getByText("【단독】 상습 지각, 이대로 괜찮은가")
      .closest("[class*='body']") as HTMLElement;
    const dispatch = (type: string, clientY?: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      if (clientY !== undefined) {
        Object.assign(event, { touches: [{ clientX: 0, clientY }] });
      }
      act(() => {
        body.dispatchEvent(event);
      });
    };

    dispatch("touchstart", 0);
    dispatch("touchmove", 200);
    dispatch("touchend");

    expect(refreshFeed).toHaveBeenCalledTimes(1);
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
