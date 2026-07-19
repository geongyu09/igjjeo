import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from ".";

function Harness({ message }: { message: string }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(message)}>
      띄우기
    </button>
  );
}

describe("Toast", () => {
  it("showToast를 호출하면 메시지를 띄운다", () => {
    render(
      <ToastProvider>
        <Harness message="문제가 생겼어요" />
      </ToastProvider>,
    );

    expect(screen.queryByText("문제가 생겼어요")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "띄우기" }));
    expect(screen.getByText("문제가 생겼어요")).toBeInTheDocument();
  });

  it("일정 시간이 지나면 토스트가 사라진다", () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider>
          <Harness message="곧 사라짐" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "띄우기" }));
      expect(screen.getByText("곧 사라짐")).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(5000));
      expect(screen.queryByText("곧 사라짐")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("Provider 밖에서 useToast를 쓰면 예외를 던진다", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness message="x" />)).toThrow();
    spy.mockRestore();
  });
});
