import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScreenHeader } from ".";

describe("ScreenHeader", () => {
  it("타이틀을 렌더링한다", () => {
    render(<ScreenHeader title="제보하기" />);
    expect(screen.getByText("제보하기")).toBeInTheDocument();
  });

  it("기본(leading=back)은 '뒤로' 버튼을 보여주고 클릭하면 onBack을 호출한다", async () => {
    const onBack = vi.fn();
    render(<ScreenHeader title="상세" onBack={onBack} />);
    await userEvent.click(screen.getByRole("button", { name: "뒤로" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("leading=close면 '닫기' 버튼을 보여준다", () => {
    render(<ScreenHeader title="제보하기" leading="close" />);
    expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();
  });

  it("leading=none이면 좌측 버튼이 없다", () => {
    render(<ScreenHeader title="프로필" leading="none" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("trailing 슬롯을 렌더링한다", () => {
    render(
      <ScreenHeader title="구독" leading="none" trailing={<span>설정</span>} />,
    );
    expect(screen.getByText("설정")).toBeInTheDocument();
  });
});
