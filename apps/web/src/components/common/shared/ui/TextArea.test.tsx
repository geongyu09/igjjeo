import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextArea } from "./TextArea";

describe("TextArea", () => {
  it("label과 textarea가 연결된다", () => {
    render(<TextArea label="무엇이 일어났나요?" />);
    expect(screen.getByLabelText("무엇이 일어났나요?")).toBeInTheDocument();
  });

  it("maxLength가 있으면 글자 수 카운터를 보여준다", () => {
    render(
      <TextArea label="제보" maxLength={140} value="민규가 오늘도 지각했어요." onChange={() => {}} />,
    );
    expect(screen.getByText("14 / 140")).toBeInTheDocument();
  });

  it("maxLength가 없으면 카운터를 보여주지 않는다", () => {
    render(<TextArea label="제보" value="내용" onChange={() => {}} />);
    expect(screen.queryByText(/\/ /)).not.toBeInTheDocument();
  });

  it("error가 있으면 aria-invalid와 오류 메시지를 노출한다", () => {
    render(<TextArea label="제보" error="내용을 입력해주세요" />);
    expect(screen.getByLabelText("제보")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("내용을 입력해주세요")).toBeInTheDocument();
  });
});
