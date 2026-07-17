import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const { loginMutate, signupMutate, loginState, signupState } = vi.hoisted(
  () => ({
    loginMutate: vi.fn(),
    signupMutate: vi.fn(),
    loginState: { isPending: false, isError: false, error: null as unknown },
    signupState: { isPending: false, isError: false, error: null as unknown },
  }),
);

vi.mock("@/hooks/features/query/mutations/useLoginMutation", () => ({
  useLoginMutation: () => ({
    mutate: loginMutate,
    reset: vi.fn(),
    ...loginState,
  }),
}));

vi.mock("@/hooks/features/query/mutations/useSignupMutation", () => ({
  useSignupMutation: () => ({
    mutate: signupMutate,
    reset: vi.fn(),
    ...signupState,
  }),
}));

import { AuthScreen } from "./AuthScreen";

describe("AuthScreen", () => {
  beforeEach(() => {
    loginMutate.mockClear();
    signupMutate.mockClear();
    Object.assign(loginState, { isPending: false, isError: false, error: null });
    Object.assign(signupState, {
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("기본은 로그인 폼 — 이메일·비밀번호만, 이름 필드는 없다", () => {
    render(<AuthScreen />);
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.queryByLabelText("이름")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("회원가입으로 전환하면 이름 필드와 가입 버튼이 나온다", () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole("button", { name: /회원가입/ }));
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "가입하기" }),
    ).toBeInTheDocument();
  });

  it("로그인 제출 시 이메일·비밀번호로 mutate를 호출한다", () => {
    render(<AuthScreen />);
    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "me@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(loginMutate).toHaveBeenCalledTimes(1);
    expect(loginMutate.mock.calls[0][0]).toEqual({
      email: "me@example.com",
      password: "secret123",
    });
  });

  it("회원가입 제출 시 이메일·비밀번호·이름으로 mutate를 호출한다", () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole("button", { name: /회원가입/ }));
    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText("이름"), {
      target: { value: "김건규" },
    });
    fireEvent.click(screen.getByRole("button", { name: "가입하기" }));

    expect(signupMutate).toHaveBeenCalledTimes(1);
    expect(signupMutate.mock.calls[0][0]).toEqual({
      email: "new@example.com",
      password: "secret123",
      displayName: "김건규",
    });
  });

  it("로그인 실패(401) 시 자격 불일치 메시지를 보여준다", () => {
    Object.assign(loginState, {
      isError: true,
      error: new ApiError({
        status: 401,
        code: "unauthorized",
        message: "unauthorized",
      }),
    });
    render(<AuthScreen />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "이메일 또는 비밀번호가 올바르지 않습니다",
    );
  });

  it("빈 입력이면 제출 버튼이 비활성화된다", () => {
    render(<AuthScreen />);
    expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
  });
});
