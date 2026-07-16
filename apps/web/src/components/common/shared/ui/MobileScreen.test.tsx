import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileScreen } from "./MobileScreen";

describe("MobileScreen", () => {
  it("본문 children을 렌더링한다", () => {
    render(<MobileScreen>본문 내용</MobileScreen>);
    expect(screen.getByText("본문 내용")).toBeInTheDocument();
  });

  it("header와 footer 슬롯을 렌더링한다", () => {
    render(
      <MobileScreen header={<div>헤더</div>} footer={<div>푸터</div>}>
        본문
      </MobileScreen>,
    );
    expect(screen.getByText("헤더")).toBeInTheDocument();
    expect(screen.getByText("푸터")).toBeInTheDocument();
  });

  it("tone=dark면 data-tone을 노출한다", () => {
    const { container } = render(<MobileScreen tone="dark">x</MobileScreen>);
    expect(container.querySelector('[data-tone="dark"]')).toBeInTheDocument();
  });
});
