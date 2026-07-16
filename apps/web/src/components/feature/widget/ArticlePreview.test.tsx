import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticlePreview } from "./ArticlePreview";

describe("ArticlePreview", () => {
  it("헤드라인·본문·바이라인을 렌더링한다", () => {
    render(
      <ArticlePreview
        outlet="shock"
        headline="상습 지각, 이대로 괜찮은가"
        body="충격. 또 늦었다."
        byline="특종 기자 · 방금 · 제보 김*규"
      />,
    );
    expect(screen.getByText("상습 지각, 이대로 괜찮은가")).toBeInTheDocument();
    expect(screen.getByText("충격. 또 늦었다.")).toBeInTheDocument();
    expect(screen.getByText(/특종 기자/)).toBeInTheDocument();
  });

  it("언론사 배지를 보여준다", () => {
    render(<ArticlePreview outlet="emotion" headline="침묵" body="본문" byline="메타" />);
    expect(screen.getByText("주간감성")).toBeInTheDocument();
  });
});
