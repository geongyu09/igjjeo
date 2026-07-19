import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BlockingOverlay } from "./index";

describe("BlockingOverlay", () => {
  it("열려 있지 않으면 아무 것도 렌더링하지 않는다", () => {
    render(<BlockingOverlay open={false} message="기사 만드는 중" />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("열리면 안내 문구를 담은 모달을 렌더링한다", () => {
    render(<BlockingOverlay open message="기사 만드는 중" />);
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("기사 만드는 중")).toBeInTheDocument();
  });

  it("설명 문구를 함께 보여준다", () => {
    render(
      <BlockingOverlay
        open
        message="기사 만드는 중"
        description="기다려 주세요"
      />,
    );
    expect(screen.getByText("기다려 주세요")).toBeInTheDocument();
  });

  // 뒤 화면의 터치·클릭을 삼키는 것이 이 컴포넌트의 존재 이유다.
  it("뒤 화면으로 향하는 포인터 이벤트를 삼킨다", async () => {
    const onBehind = vi.fn();
    render(
      <div onClick={onBehind}>
        <button type="button" onClick={onBehind}>
          뒤 버튼
        </button>
        <BlockingOverlay open message="기사 만드는 중" />
      </div>,
    );

    await userEvent.click(screen.getByRole("alertdialog"));
    expect(onBehind).not.toHaveBeenCalled();
  });
});
