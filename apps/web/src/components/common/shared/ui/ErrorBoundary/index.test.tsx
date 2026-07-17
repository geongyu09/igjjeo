import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from ".";

function Boom({ message = "터졌다" }: { message?: string }): never {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  it("자식이 던진 오류를 잡아 fallback을 그린다", () => {
    // getDerivedStateFromError 경고 억제
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={({ error }) => <p>실패: {error.message}</p>}>
        <Boom message="지각 사건" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("실패: 지각 사건")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("reset을 호출하면 오류를 해제하고 다시 자식을 렌더한다", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Flaky() {
      const [ok, setOk] = useState(false);
      if (!ok) {
        // 첫 렌더는 오류, reset 시 상태를 바꿔 통과시킨다
        return (
          <ErrorBoundary
            onReset={() => setOk(true)}
            fallback={({ reset }) => (
              <button type="button" onClick={reset}>
                다시 시도
              </button>
            )}
          >
            <Boom />
          </ErrorBoundary>
        );
      }
      return <p>복구됨</p>;
    }

    render(<Flaky />);
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(screen.getByText("복구됨")).toBeInTheDocument();
    spy.mockRestore();
  });
});
