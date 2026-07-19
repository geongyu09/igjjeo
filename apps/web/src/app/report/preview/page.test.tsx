import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { backMock, publishMutateMock } = vi.hoisted(() => ({
  backMock: vi.fn(),
  publishMutateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("reportId=r1"),
}));

vi.mock("@/hooks/common/useStackBack", () => ({
  useStackBack: () => backMock,
}));

vi.mock("@/hooks/features/report/useCloseReportModal", () => ({
  useCloseReportModal: () => vi.fn(),
}));

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useReportDraftSuspenseQuery",
  () => ({
    useReportDraftSuspenseQuery: () => ({
      data: {
        draft_articles: [
          {
            outlet_key: "daily",
            headline: "제목",
            body: "본문",
            reporter_name: "김기자",
          },
        ],
      },
    }),
  }),
);

vi.mock("@/hooks/features/query/mutations/usePublishReportMutation", () => ({
  usePublishReportMutation: () => ({
    mutate: publishMutateMock,
    isPending: false,
  }),
}));

import PublishPreviewPage from "./page";

describe("PublishPreviewPage 이탈 확인", () => {
  beforeEach(() => {
    backMock.mockClear();
    publishMutateMock.mockClear();
  });

  it("'언론사 변경'을 누르면 바로 나가지 않고 확인 다이얼로그를 띄운다", async () => {
    render(<PublishPreviewPage />);
    await userEvent.click(screen.getByRole("button", { name: "언론사 변경" }));

    expect(backMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByText(/발행 횟수만 차감/),
    ).toBeInTheDocument();
  });

  it("헤더 뒤로가기를 눌러도 바로 나가지 않고 확인 다이얼로그를 띄운다", async () => {
    render(<PublishPreviewPage />);
    await userEvent.click(screen.getByRole("button", { name: "뒤로" }));

    expect(backMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("다이얼로그에서 '나가기'를 눌러야 실제로 뒤로 이동한다", async () => {
    render(<PublishPreviewPage />);
    await userEvent.click(screen.getByRole("button", { name: "언론사 변경" }));
    await userEvent.click(screen.getByRole("button", { name: "나가기" }));

    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it("다이얼로그에서 '계속 작성'을 누르면 나가지 않고 닫힌다", async () => {
    render(<PublishPreviewPage />);
    await userEvent.click(screen.getByRole("button", { name: "언론사 변경" }));
    await userEvent.click(screen.getByRole("button", { name: "계속 작성" }));

    expect(backMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("발행 버튼은 확인 없이 바로 발행한다", async () => {
    render(<PublishPreviewPage />);
    await userEvent.click(
      screen.getByRole("button", { name: /모두 발행/ }),
    );

    expect(publishMutateMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
