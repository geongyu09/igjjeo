import { render, screen } from "@testing-library/react";
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

  it("본문과 CTA를 렌더링한다", () => {
    render(<ReportPage />);
    expect(screen.getByText("무엇이 일어났나요?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /기사 3개 만들기/ }),
    ).toBeInTheDocument();
  });
});
