import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { usePullToRefresh } from "./index";

function touch(clientY: number) {
  return { touches: [{ clientX: 0, clientY }] };
}

function Harness({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pullDistance, isRefreshing } = usePullToRefresh({
    containerRef,
    onRefresh,
  });

  return (
    <div ref={containerRef} data-testid="container">
      <span data-testid="distance">{pullDistance}</span>
      <span data-testid="refreshing">{String(isRefreshing)}</span>
    </div>
  );
}

function fireTouch(
  el: HTMLElement,
  type: "touchstart" | "touchmove" | "touchend",
  clientY?: number,
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, clientY === undefined ? {} : touch(clientY));
  act(() => {
    el.dispatchEvent(event);
  });
  return event;
}

function pull(el: HTMLElement, distance: number) {
  fireTouch(el, "touchstart", 0);
  fireTouch(el, "touchmove", distance);
}

describe("usePullToRefresh", () => {
  it("최상단에서 임계값 이상 당겼다 놓으면 onRefresh를 호출한다", () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);
    const container = screen.getByTestId("container");

    pull(container, 200);
    fireTouch(container, "touchend");

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("임계값에 못 미치게 당기면 onRefresh를 호출하지 않는다", () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);
    const container = screen.getByTestId("container");

    pull(container, 10);
    fireTouch(container, "touchend");

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("스크롤이 최상단이 아니면 당겨도 반응하지 않는다", () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);
    const container = screen.getByTestId("container");
    Object.defineProperty(container, "scrollTop", { value: 120 });

    pull(container, 200);
    fireTouch(container, "touchend");

    expect(onRefresh).not.toHaveBeenCalled();
    expect(screen.getByTestId("distance")).toHaveTextContent("0");
  });

  it("위로 스와이프하면 당김 거리가 늘지 않는다", () => {
    render(<Harness onRefresh={vi.fn()} />);
    const container = screen.getByTestId("container");

    fireTouch(container, "touchstart", 100);
    fireTouch(container, "touchmove", 40);

    expect(screen.getByTestId("distance")).toHaveTextContent("0");
  });

  it("당기는 동안 저항이 걸린 당김 거리를 노출하고, 놓으면 0으로 되돌린다", () => {
    render(<Harness onRefresh={vi.fn()} />);
    const container = screen.getByTestId("container");

    pull(container, 100);
    const distance = Number(screen.getByTestId("distance").textContent);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(100);

    fireTouch(container, "touchend");
    expect(screen.getByTestId("distance")).toHaveTextContent("0");
  });

  it("새로고침이 끝날 때까지 isRefreshing을 유지한다", async () => {
    let resolveRefresh: () => void = () => {};
    const onRefresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    render(<Harness onRefresh={onRefresh} />);
    const container = screen.getByTestId("container");

    pull(container, 200);
    fireTouch(container, "touchend");

    expect(screen.getByTestId("refreshing")).toHaveTextContent("true");

    await act(async () => {
      resolveRefresh();
    });

    expect(screen.getByTestId("refreshing")).toHaveTextContent("false");
    expect(screen.getByTestId("distance")).toHaveTextContent("0");
  });

  it("새로고침 중에는 다시 당겨도 onRefresh를 중복 호출하지 않는다", () => {
    const onRefresh = vi.fn(() => new Promise<void>(() => {}));
    render(<Harness onRefresh={onRefresh} />);
    const container = screen.getByTestId("container");

    pull(container, 200);
    fireTouch(container, "touchend");
    pull(container, 200);
    fireTouch(container, "touchend");

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("onRefresh가 없으면 당겨도 아무 일도 일어나지 않는다", () => {
    render(<Harness />);
    const container = screen.getByTestId("container");

    pull(container, 200);
    fireTouch(container, "touchend");

    expect(screen.getByTestId("refreshing")).toHaveTextContent("false");
    expect(screen.getByTestId("distance")).toHaveTextContent("0");
  });
});
