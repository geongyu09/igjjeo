import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/common/shared/ui/Toast";
import { ApiError } from "@/lib/api/errors";

const { mutateMock, quotaRef, pendingRef, bridgeRequest } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  quotaRef: {
    current: { limit: 5, used: 2, remaining: 3 } as
      { limit: number; used: number; remaining: number } | undefined,
  },
  pendingRef: { current: false },
  bridgeRequest: vi.fn(),
}));

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate: vi.fn(), isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: false }),
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request: bridgeRequest }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => true,
}));

vi.mock("@/components/common/shared/SessionProvider", () => ({
  useSession: () => ({
    me: { display_name: "나" },
    groups: [{ id: "g1", name: "3조", member_count: 9 }],
    activeGroupId: "g1",
  }),
}));

vi.mock("@/hooks/features/query/mutations/useCreateReportMutation", () => ({
  useCreateReportMutation: () => ({
    mutate: mutateMock,
    isPending: pendingRef.current,
    isError: false,
  }),
}));

vi.mock("@/hooks/features/query/querys/useReportQuotaQuery", () => ({
  useReportQuotaQuery: () => ({ data: quotaRef.current }),
}));

import ReportPage from "./page";

const renderReport = (ui: ReactElement = <ReportPage />) =>
  render(ui, { wrapper: ToastProvider });

describe("ReportPage", () => {
  // 이 화면은 앱에서 네이티브 모달로 뜨고 헤더(타이틀·닫기)는 네이티브가 그린다 —
  // 웹이 헤더를 렌더하면 모달 헤더와 두 겹이 된다.
  it("웹 헤더(타이틀·닫기)를 렌더링하지 않는다", () => {
    renderReport();
    expect(screen.queryByText("제보하기")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "닫기" }),
    ).not.toBeInTheDocument();
  });

  it("오늘 제보 한도와 남은 횟수를 표시한다", () => {
    quotaRef.current = { limit: 5, used: 2, remaining: 3 };
    renderReport();
    expect(
      screen.getByText("오늘 제보 한도 5회 중 3회 남음"),
    ).toBeInTheDocument();
  });

  it("한도를 모두 쓰면 소진 안내를 표시한다", () => {
    quotaRef.current = { limit: 5, used: 5, remaining: 0 };
    renderReport();
    expect(
      screen.getByText("오늘 제보 한도 5회를 모두 사용했어요"),
    ).toBeInTheDocument();
    quotaRef.current = { limit: 5, used: 2, remaining: 3 };
  });

  it("본문과 언론사 5곳 선택지를 렌더링한다", () => {
    renderReport();
    expect(screen.getByText("무엇이 일어났나요?")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
  });

  it("무작위 배정 UI를 노출하지 않는다", () => {
    renderReport();
    expect(screen.queryByText(/무작위/)).not.toBeInTheDocument();
    expect(screen.queryByText(/다시 뽑기/)).not.toBeInTheDocument();
  });

  it("텍스트가 있어도 언론사를 고르지 않으면 발행 CTA가 비활성이다", async () => {
    renderReport();
    await userEvent.type(
      screen.getByPlaceholderText("방금 무슨 일이 있었나요?"),
      "지각했다",
    );
    expect(screen.getByRole("button", { name: /만들기|골라/ })).toBeDisabled();
  });

  it("텍스트와 언론사 1곳을 고르면 개수가 반영된 CTA로 활성화된다", async () => {
    renderReport();
    await userEvent.type(
      screen.getByPlaceholderText("방금 무슨 일이 있었나요?"),
      "지각했다",
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    const cta = screen.getByRole("button", { name: /기사 1개 만들기/ });
    expect(cta).toBeEnabled();
  });

  it("언론사를 여러 곳 고르면 CTA 개수가 늘어난다", async () => {
    renderReport();
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /데일리쇼크/ }));
    expect(
      screen.getByRole("button", { name: /기사 2개 만들기/ }),
    ).toBeInTheDocument();
  });

  it("언론사 선택 한도를 안내한다", () => {
    renderReport();
    expect(
      screen.getByText("원하는 곳을 골라주세요 (최소 1곳, 최대 3곳)."),
    ).toBeInTheDocument();
  });

  it("언론사는 3곳까지만 고를 수 있다", async () => {
    renderReport();
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /데일리쇼크/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /모임과학/ }));

    const fourth = screen.getByRole("checkbox", { name: /주간감성/ });
    expect(fourth).toBeDisabled();
    await userEvent.click(fourth);
    expect(
      screen.getByRole("button", { name: /기사 3개 만들기/ }),
    ).toBeInTheDocument();
  });

  it("기사 생성에 실패하면 에러를 토스트로 띄운다", async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onError?.(new Error("실패"));
    });
    renderReport();
    await userEvent.type(
      screen.getByPlaceholderText("방금 무슨 일이 있었나요?"),
      "지각했다",
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    await userEvent.click(
      screen.getByRole("button", { name: /기사 1개 만들기/ }),
    );

    expect(
      await screen.findByText(/기사를 만들지 못했어요/),
    ).toBeInTheDocument();
  });

  // 하루 한도 소진은 재시도로 풀리지 않는다 — 일반 실패 문구로 뭉뚱그리면 안 된다.
  it("하루 제보 한도를 다 쓰면 서버가 준 한도 안내를 그대로 토스트로 띄운다", async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onError?.(
        new ApiError({
          status: 429,
          code: "rate_limited",
          message: "하루 제보 한도(5회)를 모두 사용했어요",
          details: { limit: 5, scope: "report_daily" },
        }),
      );
    });
    renderReport();
    await userEvent.type(
      screen.getByPlaceholderText("방금 무슨 일이 있었나요?"),
      "지각했다",
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    await userEvent.click(
      screen.getByRole("button", { name: /기사 1개 만들기/ }),
    );

    expect(
      await screen.findByText("하루 제보 한도(5회)를 모두 사용했어요"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/기사를 만들지 못했어요/),
    ).not.toBeInTheDocument();
  });

  it("한도 초과 응답에 메시지가 비어 있어도 한도 안내 문구로 대체한다", async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onError?.(
        new ApiError({ status: 429, code: "rate_limited", message: "" }),
      );
    });
    renderReport();
    await userEvent.type(
      screen.getByPlaceholderText("방금 무슨 일이 있었나요?"),
      "지각했다",
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    await userEvent.click(
      screen.getByRole("button", { name: /기사 1개 만들기/ }),
    );

    expect(
      await screen.findByText(/오늘 제보 한도를 모두 사용했어요/),
    ).toBeInTheDocument();
  });

  // 각색은 되돌릴 수 없는 요청(한도 차감)이라 진행 중 이탈·재조작을 전부 막는다.
  describe("각색 진행 중", () => {
    afterEach(() => {
      pendingRef.current = false;
    });

    it("차단 오버레이를 띄운다", () => {
      pendingRef.current = true;
      renderReport();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("본문·언론사 선택을 조작할 수 없게 만든다", () => {
      pendingRef.current = true;
      renderReport();
      const textarea = screen.getByPlaceholderText("방금 무슨 일이 있었나요?");
      expect(textarea.closest("[inert]")).not.toBeNull();
    });

    it("네이티브 제보 모달의 닫기를 잠근다", () => {
      bridgeRequest.mockClear();
      pendingRef.current = true;
      renderReport();
      expect(bridgeRequest).toHaveBeenCalledWith({
        requestMessage: {
          type: "setReportModalDismissible",
          payload: { dismissible: false },
        },
      });
    });
  });

  it("각색 중이 아니면 오버레이 없이 조작할 수 있다", () => {
    renderReport();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(
      screen
        .getByPlaceholderText("방금 무슨 일이 있었나요?")
        .closest("[inert]"),
    ).toBeNull();
  });
});
