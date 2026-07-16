import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate: vi.fn(), isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: true }),
}));

import ArticleDetailPage from "./page";

async function renderPage(id = "1") {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <ArticleDetailPage params={Promise.resolve({ id })} />
      </Suspense>,
    );
  });
}

describe("ArticleDetailPage", () => {
  it("기사 헤드라인과 반응 바를 렌더링한다", async () => {
    await renderPage("1");
    expect(screen.getByText("【단독】 상습 지각, 이대로 괜찮은가")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /인정/ })).toBeInTheDocument();
  });

  it("반응을 누르면 카운트가 1 증가한다", async () => {
    await renderPage("1");
    const scoop = screen.getByRole("button", { name: /특종/ });
    expect(scoop).toHaveTextContent("3");
    await userEvent.click(scoop);
    expect(scoop).toHaveTextContent("4");
    expect(scoop).toHaveAttribute("aria-pressed", "true");
  });
});
