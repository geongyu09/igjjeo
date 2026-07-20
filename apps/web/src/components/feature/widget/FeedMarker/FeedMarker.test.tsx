import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedMarker } from ".";

describe("FeedMarker", () => {
  it("hot 마크는 '오늘 가장 뜨거운'을 보여준다", () => {
    render(<FeedMarker variant="hot" />);
    expect(screen.getByText("오늘 가장 뜨거운")).toBeInTheDocument();
  });

  it("fresh 마크는 '최신 뉴스'를 보여준다", () => {
    render(<FeedMarker variant="fresh" />);
    expect(screen.getByText("최신 뉴스")).toBeInTheDocument();
  });

  it("variant를 data 속성으로 노출한다", () => {
    render(<FeedMarker variant="fresh" />);
    expect(screen.getByText("최신 뉴스")).toHaveAttribute(
      "data-variant",
      "fresh",
    );
  });

  it("바깥에서 준 className을 함께 붙인다", () => {
    render(<FeedMarker variant="hot" className="overlay" />);
    expect(screen.getByText("오늘 가장 뜨거운")).toHaveClass("overlay");
  });
});
