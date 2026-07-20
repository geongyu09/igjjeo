import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { onboardingStore } from "@/lib/session/onboardingStore";

import { OnboardingSection } from ".";

/** 마지막 장까지 CTA를 눌러 진행한다. */
async function advanceToLast() {
  await userEvent.click(
    screen.getByRole("button", { name: "어떻게 되는지 볼게요" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "언론사가 궁금해요" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "하나만 알려주세요" }),
  );
}

describe("OnboardingSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
    onboardingStore.reset();
  });

  it("첫 장에서 서비스 이름과 한 줄 정의를 보여준다", () => {
    render(<OnboardingSection onComplete={vi.fn()} />);
    expect(screen.getByText("이거 진짜예요?")).toBeInTheDocument();
    expect(screen.getByText("사소한 일이 뉴스가 되는 곳")).toBeInTheDocument();
  });

  it("CTA를 누르면 제보에서 기사까지의 흐름 장으로 넘어간다", async () => {
    render(<OnboardingSection onComplete={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "어떻게 되는지 볼게요" }),
    );
    expect(screen.getByText("제보한다")).toBeInTheDocument();
    expect(screen.getByText("AI가 각색한다")).toBeInTheDocument();
    expect(screen.getByText("기사가 발행된다")).toBeInTheDocument();
  });

  it("언론사 장에서 다섯 곳을 모두 보여준다", async () => {
    render(<OnboardingSection onComplete={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "어떻게 되는지 볼게요" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "언론사가 궁금해요" }),
    );
    for (const name of [
      "소모임일보",
      "데일리쇼크",
      "모임과학",
      "주간감성",
      "일간찬양",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("진행 상태를 현재 장으로 표시한다", async () => {
    render(<OnboardingSection onComplete={vi.fn()} />);
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "1");
    expect(progress).toHaveAttribute("aria-valuemax", "4");

    await userEvent.click(
      screen.getByRole("button", { name: "어떻게 되는지 볼게요" }),
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
  });

  it("마지막 장의 CTA를 누르면 온보딩을 완료로 기록하고 onComplete를 호출한다", async () => {
    const onComplete = vi.fn();
    render(<OnboardingSection onComplete={onComplete} />);
    await advanceToLast();

    expect(screen.getByText("이름은 늘 가려서 보여줘요")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "뉴스룸 시작하기" }),
    );

    expect(onboardingStore.get()).toBe(true);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("건너뛰기를 누르면 바로 완료 처리한다", async () => {
    const onComplete = vi.fn();
    render(<OnboardingSection onComplete={onComplete} />);
    await userEvent.click(screen.getByRole("button", { name: "건너뛰기" }));

    expect(onboardingStore.get()).toBe(true);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("마지막 장에서는 건너뛰기를 보여주지 않는다", async () => {
    render(<OnboardingSection onComplete={vi.fn()} />);
    await advanceToLast();
    expect(
      screen.queryByRole("button", { name: "건너뛰기" }),
    ).not.toBeInTheDocument();
  });
});
