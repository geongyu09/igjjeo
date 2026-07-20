import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CorrectionRequestSheet } from ".";

function setup(
  props: Partial<Parameters<typeof CorrectionRequestSheet>[0]> = {},
) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <CorrectionRequestSheet
      open
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
    />,
  );
  return { onSubmit, onClose };
}

describe("CorrectionRequestSheet", () => {
  it("닫혀 있으면 아무것도 렌더하지 않는다", () => {
    setup({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("기본은 당사자 정정이고, 입력한 내용으로 제출한다", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.type(
      screen.getByLabelText("정정 내용"),
      "사실 9시 58분에 도착했다",
    );
    await user.click(screen.getByRole("button", { name: "정정 요청" }));

    expect(onSubmit).toHaveBeenCalledWith({
      isSubject: true,
      correctionText: "사실 9시 58분에 도착했다",
    });
  });

  it("제3자 정정을 고르면 isSubject=false 로 제출한다", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.click(screen.getByRole("radio", { name: /목격/ }));
    await user.type(screen.getByLabelText("정정 내용"), "그건 사실이 아니다");
    await user.click(screen.getByRole("button", { name: "정정 요청" }));

    expect(onSubmit).toHaveBeenCalledWith({
      isSubject: false,
      correctionText: "그건 사실이 아니다",
    });
  });

  it("내용이 비어 있으면 제출할 수 없다", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.type(screen.getByLabelText("정정 내용"), "   ");

    expect(screen.getByRole("button", { name: "정정 요청" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "정정 요청" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("각색 중에는 제출 버튼을 잠근다", () => {
    setup({ pending: true });

    expect(screen.getByRole("button", { name: "정정 요청" })).toBeDisabled();
  });

  it("취소하면 onClose 를 부른다", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("열리면 정정 내용 입력에 포커스를 준다", () => {
    setup();

    expect(screen.getByLabelText("정정 내용")).toHaveFocus();
  });

  it("Escape 로 닫는다", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("각색 중에는 Escape 로 닫지 않는다", async () => {
    const user = userEvent.setup();
    const { onClose } = setup({ pending: true });

    await user.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("에러 메시지를 보여준다", () => {
    setup({ errorMessage: "하루 정정 한도(5회)를 모두 사용했어요" });

    expect(
      screen.getByText("하루 정정 한도(5회)를 모두 사용했어요"),
    ).toBeInTheDocument();
  });
});
