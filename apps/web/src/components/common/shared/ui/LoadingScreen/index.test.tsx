import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoadingScreen } from ".";

describe("LoadingScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("처음에는 지연 안내를 보여주지 않는다", () => {
    render(<LoadingScreen />);
    expect(screen.queryByTestId("loading-slow-hint")).not.toBeInTheDocument();
  });

  it("로딩이 길어지면 지연 안내를 보여준다", () => {
    render(<LoadingScreen slowAfterMs={5000} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 스피너만 도는 화면은 "멈춘 것"과 구분되지 않는다 — 상태를 말로 알려준다.
    expect(screen.getByTestId("loading-slow-hint")).toBeInTheDocument();
  });

  it("지연 안내 시간이 지나기 전에는 계속 감춘다", () => {
    render(<LoadingScreen slowAfterMs={5000} />);

    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(screen.queryByTestId("loading-slow-hint")).not.toBeInTheDocument();
  });
});
