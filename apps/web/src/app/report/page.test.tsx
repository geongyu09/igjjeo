import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate: vi.fn(), isNavigating: false }),
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: false }),
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request: vi.fn() }),
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
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

import ReportPage from "./page";

describe("ReportPage", () => {
  // 이 화면은 앱에서 네이티브 모달로 뜨고 헤더(타이틀·닫기)는 네이티브가 그린다 —
  // 웹이 헤더를 렌더하면 모달 헤더와 두 겹이 된다.
  it("웹 헤더(타이틀·닫기)를 렌더링하지 않는다", () => {
    render(<ReportPage />);
    expect(screen.queryByText("제보하기")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "닫기" }),
    ).not.toBeInTheDocument();
  });

  it("본문과 언론사 5곳 선택지를 렌더링한다", () => {
    render(<ReportPage />);
    expect(screen.getByText("무엇이 일어났나요?")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
  });

  it("무작위 배정 UI를 노출하지 않는다", () => {
    render(<ReportPage />);
    expect(screen.queryByText(/무작위/)).not.toBeInTheDocument();
    expect(screen.queryByText(/다시 뽑기/)).not.toBeInTheDocument();
  });

  it("텍스트가 있어도 언론사를 고르지 않으면 발행 CTA가 비활성이다", async () => {
    render(<ReportPage />);
    await userEvent.type(
      screen.getByPlaceholderText("방금 무슨 일이 있었나요?"),
      "지각했다",
    );
    expect(screen.getByRole("button", { name: /만들기|골라/ })).toBeDisabled();
  });

  it("텍스트와 언론사 1곳을 고르면 개수가 반영된 CTA로 활성화된다", async () => {
    render(<ReportPage />);
    await userEvent.type(
      screen.getByPlaceholderText("방금 무슨 일이 있었나요?"),
      "지각했다",
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /소모임일보/ }),
    );
    const cta = screen.getByRole("button", { name: /기사 1개 만들기/ });
    expect(cta).toBeEnabled();
  });

  it("언론사를 여러 곳 고르면 CTA 개수가 늘어난다", async () => {
    render(<ReportPage />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: /소모임일보/ }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /데일리쇼크/ }),
    );
    expect(
      screen.getByRole("button", { name: /기사 2개 만들기/ }),
    ).toBeInTheDocument();
  });
});
