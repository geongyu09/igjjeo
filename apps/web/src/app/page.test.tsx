import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate, isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: true }),
}));

import FeedPage from "./page";

describe("FeedPage", () => {
  it("톱기사와 언론사 카드를 렌더링한다", () => {
    render(<FeedPage />);
    expect(screen.getByText("【단독】 상습 지각, 이대로 괜찮은가")).toBeInTheDocument();
    expect(screen.getByText("간식 예산 40% 삭감… 긴축 국면 진입")).toBeInTheDocument();
  });

  it("톱기사를 누르면 해당 기사 상세로 전환한다", async () => {
    navigate.mockClear();
    render(<FeedPage />);
    await userEvent.click(screen.getByText("【단독】 상습 지각, 이대로 괜찮은가"));
    expect(navigate).toHaveBeenCalledWith({ href: "/article/1", animation: "slide" });
  });
});
