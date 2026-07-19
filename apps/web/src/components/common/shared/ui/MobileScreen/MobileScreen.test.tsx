import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileScreen } from ".";

function dispatchTouch(
  el: HTMLElement,
  type: "touchstart" | "touchmove" | "touchend",
  clientY?: number,
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  if (clientY !== undefined) {
    Object.assign(event, { touches: [{ clientX: 0, clientY }] });
  }
  act(() => {
    el.dispatchEvent(event);
  });
}

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

  it("headerClassName을 header 슬롯에 붙인다", () => {
    render(
      <MobileScreen header={<div>헤더</div>} headerClassName="sticky-header">
        본문
      </MobileScreen>,
    );
    expect(screen.getByText("헤더").parentElement).toHaveClass("sticky-header");
  });

  it("tone=dark면 data-tone을 노출한다", () => {
    const { container } = render(<MobileScreen tone="dark">x</MobileScreen>);
    expect(container.querySelector('[data-tone="dark"]')).toBeInTheDocument();
  });

  it("onRefresh를 주면 본문 최상단에서 당겼다 놓을 때 새로고침한다", () => {
    const onRefresh = vi.fn();
    render(<MobileScreen onRefresh={onRefresh}>본문</MobileScreen>);
    const body = screen.getByText("본문").parentElement as HTMLElement;

    dispatchTouch(body, "touchstart", 0);
    dispatchTouch(body, "touchmove", 200);
    dispatchTouch(body, "touchend");

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("onRefresh가 없으면 새로고침 인디케이터를 렌더하지 않는다", () => {
    render(<MobileScreen>본문</MobileScreen>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("새로고침이 도는 동안 인디케이터를 노출한다", () => {
    const onRefresh = vi.fn(() => new Promise<void>(() => {}));
    render(<MobileScreen onRefresh={onRefresh}>본문</MobileScreen>);
    const body = screen.getByText("본문").parentElement as HTMLElement;

    dispatchTouch(body, "touchstart", 0);
    dispatchTouch(body, "touchmove", 200);
    dispatchTouch(body, "touchend");

    expect(screen.getByRole("status")).toHaveAccessibleName("새로고침 중");
  });
});
