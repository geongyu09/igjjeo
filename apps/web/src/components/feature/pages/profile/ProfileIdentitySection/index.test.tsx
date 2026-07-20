import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
let isPending = false;
let isError = false;

vi.mock("@/hooks/features/query/mutations/useUpdateProfileMutation", () => ({
  useUpdateProfileMutation: () => ({ mutate, isPending, isError }),
}));

import { ProfileIdentitySection } from ".";

describe("ProfileIdentitySection", () => {
  beforeEach(() => {
    mutate.mockReset();
    isPending = false;
    isError = false;
  });

  it("이름과 이름 수정 버튼을 렌더링한다", () => {
    render(<ProfileIdentitySection displayName="김건규" />);
    expect(screen.getByText("김건규")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "이름 수정" }),
    ).toBeInTheDocument();
  });

  it("이름 수정을 누르면 현재 이름이 채워진 입력과 저장/취소 버튼을 보여준다", async () => {
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));

    expect(screen.getByRole("textbox", { name: "이름" })).toHaveValue("김건규");
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });

  it("이름을 바꾸고 저장하면 새 이름으로 프로필 수정을 요청한다", async () => {
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));

    const input = screen.getByRole("textbox", { name: "이름" });
    await userEvent.clear(input);
    await userEvent.type(input, "박건규");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({ displayName: "박건규" });
  });

  it("앞뒤 공백을 제거한 이름으로 요청한다", async () => {
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));

    const input = screen.getByRole("textbox", { name: "이름" });
    await userEvent.clear(input);
    await userEvent.type(input, "  박건규  ");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(mutate.mock.calls[0][0]).toEqual({ displayName: "박건규" });
  });

  it("저장에 성공하면 편집 모드를 종료한다", async () => {
    mutate.mockImplementation(
      (_params, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(
      screen.queryByRole("textbox", { name: "이름" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "이름 수정" }),
    ).toBeInTheDocument();
  });

  it("이름이 비어 있으면 저장 버튼을 비활성화한다", async () => {
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));

    const input = screen.getByRole("textbox", { name: "이름" });
    await userEvent.clear(input);

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("취소를 누르면 편집 모드를 종료하고 원래 이름을 유지한다", async () => {
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));

    const input = screen.getByRole("textbox", { name: "이름" });
    await userEvent.clear(input);
    await userEvent.type(input, "다른이름");
    await userEvent.click(screen.getByRole("button", { name: "취소" }));

    expect(mutate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "이름" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("김건규")).toBeInTheDocument();
  });

  it("저장에 실패하면 에러 메시지를 보여준다", async () => {
    isError = true;
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("저장 중에는 저장 버튼을 비활성화한다", async () => {
    isPending = true;
    render(<ProfileIdentitySection displayName="김건규" />);
    await userEvent.click(screen.getByRole("button", { name: "이름 수정" }));

    expect(screen.getByRole("button", { name: "저장 중…" })).toBeDisabled();
  });
});
