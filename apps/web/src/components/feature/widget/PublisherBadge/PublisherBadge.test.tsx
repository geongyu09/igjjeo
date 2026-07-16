import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublisherBadge } from ".";

describe("PublisherBadge", () => {
  it("언론사 이름을 렌더링한다", () => {
    render(<PublisherBadge outlet="shock" />);
    expect(screen.getByText("데일리쇼크")).toBeInTheDocument();
  });

  it("outlet을 data 속성으로 노출한다", () => {
    render(<PublisherBadge outlet="economy" />);
    expect(screen.getByText("스터디경제")).toHaveAttribute(
      "data-outlet",
      "economy",
    );
  });

  it("기본 variant는 soft다", () => {
    render(<PublisherBadge outlet="daily" />);
    expect(screen.getByText("소모임일보")).toHaveAttribute(
      "data-variant",
      "soft",
    );
  });

  it("solid·text variant를 지원한다", () => {
    render(
      <>
        <PublisherBadge outlet="shock" variant="solid" />
        <PublisherBadge outlet="daily" variant="text" />
      </>,
    );
    expect(screen.getByText("데일리쇼크")).toHaveAttribute(
      "data-variant",
      "solid",
    );
    expect(screen.getByText("소모임일보")).toHaveAttribute(
      "data-variant",
      "text",
    );
  });
});
