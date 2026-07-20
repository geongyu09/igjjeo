import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate: vi.fn(), isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: true }),
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request: vi.fn() }),
}));

const { useArticleCorrectionsSuspenseQuery } = vi.hoisted(() => ({
  useArticleCorrectionsSuspenseQuery: vi.fn(),
}));
const { correctionMutate } = vi.hoisted(() => ({ correctionMutate: vi.fn() }));

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useArticleCorrectionsSuspenseQuery",
  () => ({ useArticleCorrectionsSuspenseQuery }),
);
vi.mock(
  "@/hooks/features/query/mutations/useRequestCorrectionMutation",
  () => ({
    useRequestCorrectionMutation: () => ({
      mutate: correctionMutate,
      isPending: false,
    }),
  }),
);

import CorrectionThreadPage from "./page";

function article(overrides: Record<string, unknown>) {
  return {
    id: "a1",
    report_id: "r1",
    outlet_key: "daily",
    headline: "머리기사",
    body: "본문",
    reporter_name: "기자",
    published_at: "2026-07-20T00:00:00.000Z",
    is_correction: false,
    corrects_article_id: null,
    ...overrides,
  };
}

async function renderPage(id = "1", items: unknown[] = []) {
  useArticleCorrectionsSuspenseQuery.mockReturnValue({ data: { items } });
  await act(async () => {
    render(<CorrectionThreadPage params={Promise.resolve({ id })} />);
  });
}

describe("CorrectionThreadPage", () => {
  it("정정 이력이 없으면 빈 상태를 보여준다", async () => {
    await renderPage();

    expect(screen.getByText("아직 정정 이력이 없어요")).toBeInTheDocument();
  });

  it("체인에 원본 기사 하나뿐이면 빈 상태를 보여준다", async () => {
    await renderPage("a1", [article({ id: "a1", headline: "최초 보도" })]);

    expect(screen.getByText("아직 정정 이력이 없어요")).toBeInTheDocument();
  });

  it("정정 기사에서 열어도 최초 기사부터 연쇄 전체를 보여준다", async () => {
    await renderPage("a2", [
      article({ id: "a1", headline: "최초 보도" }),
      article({
        id: "a2",
        headline: "본지는 앞선 보도를 정정합니다",
        is_correction: true,
        corrects_article_id: "a1",
        published_at: "2026-07-20T01:00:00.000Z",
      }),
      article({
        id: "a3",
        headline: "정정에 대한 재정정",
        is_correction: true,
        corrects_article_id: "a2",
        published_at: "2026-07-20T02:00:00.000Z",
      }),
    ]);

    const headlines = screen
      .getAllByRole("listitem")
      .map((item) => item.querySelector("h4")?.textContent);

    expect(headlines).toEqual([
      "최초 보도",
      "본지는 앞선 보도를 정정합니다",
      "정정에 대한 재정정",
    ]);
    expect(screen.getByText("정정")).toBeInTheDocument();
    expect(screen.getByText("재정정")).toBeInTheDocument();
  });

  it("'나도 정정 요청'을 누르면 정정 요청 시트를 연다", async () => {
    await renderPage();

    await userEvent.click(
      screen.getByRole("button", { name: /나도 정정 요청/ }),
    );

    expect(
      screen.getByRole("dialog", { name: "정정 요청" }),
    ).toBeInTheDocument();
  });

  it("당사자/제3자와 내용을 담아 정정을 요청한다", async () => {
    correctionMutate.mockClear();
    await renderPage("a1");

    await userEvent.click(
      screen.getByRole("button", { name: /나도 정정 요청/ }),
    );
    await userEvent.click(screen.getByRole("radio", { name: /목격/ }));
    await userEvent.type(
      screen.getByLabelText("정정 내용"),
      "그건 사실이 아니다",
    );
    await userEvent.click(screen.getByRole("button", { name: "정정 요청" }));

    expect(correctionMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: "a1",
        isSubject: false,
        correctionText: "그건 사실이 아니다",
      }),
      expect.anything(),
    );
  });
});
