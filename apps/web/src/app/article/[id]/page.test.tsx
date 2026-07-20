import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactionCounts } from "@/lib/api/types";

vi.mock("stack-link", () => ({
  StackLink: ({
    href,
    preLoad,
    animation,
    children,
  }: {
    href: string;
    preLoad?: boolean;
    animation?: string;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="stack-link"
      data-href={href}
      data-preload={preLoad ? "" : undefined}
      data-animation={animation}
    >
      {children}
    </div>
  ),
  useStackLinkRouter: () => ({ navigate: vi.fn(), isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: true }),
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request: vi.fn() }),
}));

const zeroReactions: ReactionCounts = {
  really: 0,
  shock: 0,
  admit: 0,
  scoop: 0,
};

const { useArticleSuspenseQuery } = vi.hoisted(() => ({
  useArticleSuspenseQuery: vi.fn(),
}));
const { useArticleCommentsSuspenseQuery } = vi.hoisted(() => ({
  useArticleCommentsSuspenseQuery: vi.fn(),
}));
const { addMutate, removeMutate, commentMutate, deletionMutate } = vi.hoisted(
  () => ({
    addMutate: vi.fn(),
    removeMutate: vi.fn(),
    commentMutate: vi.fn(),
    deletionMutate: vi.fn(),
  }),
);

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useArticleSuspenseQuery",
  () => ({ useArticleSuspenseQuery }),
);
vi.mock(
  "@/hooks/features/query/suspenseQuerys/useArticleCommentsSuspenseQuery",
  () => ({ useArticleCommentsSuspenseQuery }),
);
vi.mock("@/hooks/features/query/mutations/useAddReactionMutation", () => ({
  useAddReactionMutation: () => ({ mutate: addMutate, isPending: false }),
}));
vi.mock("@/hooks/features/query/mutations/useRemoveReactionMutation", () => ({
  useRemoveReactionMutation: () => ({ mutate: removeMutate, isPending: false }),
}));
vi.mock("@/hooks/features/query/mutations/useCreateCommentMutation", () => ({
  useCreateCommentMutation: () => ({ mutate: commentMutate, isPending: false }),
}));
vi.mock("@/hooks/features/query/mutations/useRequestDeletionMutation", () => ({
  useRequestDeletionMutation: () => ({
    mutate: deletionMutate,
    isPending: false,
  }),
}));

import ArticleDetailPage from "./page";

function mockArticle(myReactions: string[] = [], isMine = false) {
  useArticleSuspenseQuery.mockReturnValue({
    data: {
      id: "1",
      group_id: "g1",
      outlet_key: "shock",
      headline: "【단독】 상습 지각, 이대로 괜찮은가",
      body: "본문",
      reporter_name: "충격 기자",
      reporter: { masked_name: "김*규" },
      is_mine: isMine,
      published_at: "2026-07-17T10:24:00Z",
      reaction_counts: { ...zeroReactions, scoop: 3 },
      my_reactions: myReactions,
    },
  });
  useArticleCommentsSuspenseQuery.mockReturnValue({
    data: { pages: [{ items: [], next_cursor: null }] },
  });
}

async function renderPage(id = "1") {
  await act(async () => {
    render(<ArticleDetailPage params={Promise.resolve({ id })} />);
  });
}

describe("ArticleDetailPage", () => {
  it("기사 헤드라인과 반응 바를 렌더링한다", async () => {
    mockArticle();
    await renderPage("1");
    expect(
      screen.getByText("【단독】 상습 지각, 이대로 괜찮은가"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /인정/ })).toBeInTheDocument();
  });

  it("안 누른 반응을 누르면 추가 뮤테이션을 호출한다", async () => {
    mockArticle([]);
    addMutate.mockClear();
    await renderPage("1");
    await userEvent.click(screen.getByRole("button", { name: /특종/ }));
    expect(addMutate).toHaveBeenCalledWith({
      articleId: "1",
      reactionType: "scoop",
    });
  });

  it("이미 누른 반응을 다시 누르면 취소 뮤테이션을 호출한다", async () => {
    mockArticle(["scoop"]);
    removeMutate.mockClear();
    await renderPage("1");
    await userEvent.click(screen.getByRole("button", { name: /특종/ }));
    expect(removeMutate).toHaveBeenCalledWith({
      articleId: "1",
      reactionType: "scoop",
    });
  });

  it("내가 올린 기사가 아니면 내리기 진입점을 두지 않는다", async () => {
    mockArticle([], false);
    await renderPage("1");

    expect(
      screen.queryByRole("button", { name: "기사 내리기" }),
    ).not.toBeInTheDocument();
  });

  it("내가 올린 기사는 확인을 받고 내린다", async () => {
    mockArticle([], true);
    deletionMutate.mockClear();
    await renderPage("1");

    await userEvent.click(screen.getByRole("button", { name: "기사 내리기" }));
    expect(screen.getByText("이 기사를 내릴까요?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "내리기" }));
    expect(deletionMutate).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: "1", groupId: "g1" }),
      expect.anything(),
    );
  });

  it("정정 요청은 정정 연쇄 화면으로 가는 preLoad StackLink다", async () => {
    mockArticle();
    await renderPage("1");
    const link = screen.getByTestId("stack-link");
    expect(link).toHaveAttribute("data-href", "/article/1/thread");
    expect(link).toHaveAttribute("data-preload");
    expect(link).toHaveTextContent("정정 요청");
  });
});
