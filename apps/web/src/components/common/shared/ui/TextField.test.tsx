import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("label과 input이 연결된다", () => {
    render(<TextField label="방 이름" placeholder="예: 3조 뉴스룸" />);
    expect(screen.getByLabelText("방 이름")).toBeInTheDocument();
  });

  it("입력하면 onChange가 호출된다", async () => {
    const onChange = vi.fn();
    render(<TextField label="방 이름" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("방 이름"), "3조");
    expect(onChange).toHaveBeenCalled();
  });

  it("error가 있으면 aria-invalid와 오류 메시지를 노출한다", () => {
    render(<TextField label="초대 코드" error="코드는 4자리예요" />);
    const input = screen.getByLabelText("초대 코드");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("코드는 4자리예요")).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription("코드는 4자리예요");
  });

  it("error가 없으면 aria-invalid를 설정하지 않는다", () => {
    render(<TextField label="방 이름" />);
    expect(screen.getByLabelText("방 이름")).not.toHaveAttribute("aria-invalid");
  });
});
