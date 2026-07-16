import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublisherWordmark } from "./PublisherWordmark";

describe("PublisherWordmark", () => {
  it("언론사 이름을 워드마크로 렌더링한다", () => {
    render(<PublisherWordmark outlet="emotion" />);
    expect(screen.getByText("주간감성")).toBeInTheDocument();
  });

  it("outlet별 타이포 스타일을 data 속성으로 노출한다", () => {
    render(<PublisherWordmark outlet="shock" />);
    expect(screen.getByText("데일리쇼크")).toHaveAttribute("data-outlet", "shock");
  });
});
