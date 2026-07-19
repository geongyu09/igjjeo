import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from ".";

const baseProps = {
  title: "정말 나가시겠어요?",
  description: "여기서 나가면 발행이 되지 않고 발행 횟수만 차감돼요.",
  confirmLabel: "나가기",
  cancelLabel: "계속 작성",
};

describe("ConfirmDialog", () => {
  it("open=false면 아무것도 렌더링하지 않는다", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        open={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText(baseProps.title)).not.toBeInTheDocument();
  });

  it("open=true면 제목·설명과 두 버튼을 렌더링한다", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        open
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(baseProps.title)).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: baseProps.confirmLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: baseProps.cancelLabel }),
    ).toBeInTheDocument();
  });

  it("확인 버튼을 누르면 onConfirm만 호출한다", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: baseProps.confirmLabel }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("취소 버튼을 누르면 onCancel만 호출한다", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: baseProps.cancelLabel }),
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Escape 키를 누르면 onCancel을 호출한다", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        open
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("배경(overlay)을 누르면 onCancel을 호출한다", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        open
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByTestId("confirm-dialog-overlay"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
