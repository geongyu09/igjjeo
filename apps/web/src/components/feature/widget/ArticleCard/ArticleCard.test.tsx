import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArticleCard } from ".";

describe("ArticleCard", () => {
  it("헤드라인과 언론사를 렌더링한다", () => {
    render(
      <ArticleCard
        outlet="shock"
        headline="【단독】 상습 지각, 이대로 괜찮은가"
      />,
    );
    expect(
      screen.getByText("【단독】 상습 지각, 이대로 괜찮은가"),
    ).toBeInTheDocument();
    expect(screen.getByText("데일리쇼크")).toBeInTheDocument();
  });

  it("기본 variant는 large다", () => {
    render(<ArticleCard outlet="shock" headline="제목" />);
    expect(screen.getByRole("article")).toHaveAttribute(
      "data-variant",
      "large",
    );
  });

  it("large는 발췌문·조회수·댓글수·제보자를 보여준다", () => {
    render(
      <ArticleCard
        outlet="shock"
        headline="제목"
        excerpt="충격. 또 늦었다."
        viewCount={12}
        commentCount={5}
        reporterLabel="김*규"
      />,
    );
    expect(screen.getByText("충격. 또 늦었다.")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("제보 김*규")).toBeInTheDocument();
  });

  it("large 기본은 사진 플레이스홀더를 보여주고, hidePhoto면 생략한다", () => {
    const { rerender } = render(
      <ArticleCard outlet="shock" headline="제목" excerpt="발췌" />,
    );
    expect(screen.getByText("사진")).toBeInTheDocument();
    rerender(
      <ArticleCard outlet="shock" headline="제목" excerpt="발췌" hidePhoto />,
    );
    expect(screen.queryByText("사진")).not.toBeInTheDocument();
  });

  it("hero는 badge 슬롯을 렌더링한다", () => {
    render(
      <ArticleCard
        variant="hero"
        outlet="shock"
        headline="제목"
        badge={<span>오늘 가장 뜨거운</span>}
      />,
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-variant", "hero");
    expect(screen.getByText("오늘 가장 뜨거운")).toBeInTheDocument();
  });

  it("list는 시간 라벨을 메타에 보여준다", () => {
    render(
      <ArticleCard
        variant="list"
        outlet="economy"
        headline="제목"
        viewCount={7}
        commentCount={2}
        timeLabel="1시간"
      />,
    );
    expect(screen.getByText(/1시간/)).toBeInTheDocument();
  });

  it("클릭하면 onClick이 호출된다", async () => {
    const onClick = vi.fn();
    render(<ArticleCard outlet="daily" headline="제목" onClick={onClick} />);
    await userEvent.click(screen.getByRole("article"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("onClick이 있으면 키보드(Enter)로도 조작할 수 있다", async () => {
    const onClick = vi.fn();
    render(<ArticleCard outlet="daily" headline="제목" onClick={onClick} />);
    const card = screen.getByRole("article");
    card.focus();
    expect(card).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("onClick이 없으면 tab 순서에 들어가지 않는다", () => {
    render(<ArticleCard outlet="daily" headline="제목" />);
    expect(screen.getByRole("article")).not.toHaveAttribute("tabindex");
  });
});
