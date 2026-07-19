import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/common/shared/ui/Toast";

const { mutateMock, createdRef } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  createdRef: {
    current: {
      id: "g1",
      name: "3조 뉴스룸",
      invite_code: "7K2Q",
      member_count: 1,
    },
  },
}));

vi.mock("@/hooks/common/useStackBack", () => ({
  useStackBack: () => vi.fn(),
}));

vi.mock("@/hooks/common/useEnterRoom", () => ({
  useEnterRoom: () => vi.fn(),
}));

vi.mock("@/components/common/shared/SessionProvider", () => ({
  useSession: () => ({ me: { display_name: "나" } }),
}));

vi.mock("@/hooks/features/query/mutations/useCreateGroupMutation", () => ({
  useCreateGroupMutation: () => ({
    mutate: mutateMock,
    isPending: false,
    isError: false,
  }),
}));

import CreateGroupPage from "./page";

const renderPage = (ui: ReactElement = <CreateGroupPage />) =>
  render(ui, { wrapper: ToastProvider });

const writeTextMock = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  writeTextMock.mockReset();
  writeTextMock.mockResolvedValue(undefined);
  mutateMock.mockClear();
  mutateMock.mockImplementation(
    (_params: unknown, opts?: { onSuccess?: (group: unknown) => void }) => {
      opts?.onSuccess?.(createdRef.current);
    },
  );
});

/**
 * 페이지를 렌더한다. userEvent.setup()이 navigator.clipboard를 자체 stub으로
 * 덮으므로, setup 이후에 우리 writeText mock으로 다시 심는다.
 */
function setupPage() {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: writeTextMock },
    configurable: true,
  });
  renderPage();
  return user;
}

/** 방 이름을 입력하고 만들기를 눌러 created(초대 코드) 상태로 진입시킨다. */
async function createRoom(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("방 이름"), "3조 뉴스룸");
  await user.click(screen.getByRole("button", { name: "뉴스룸 만들기" }));
}

describe("CreateGroupPage 키워드", () => {
  it("키워드를 입력하면 방 생성 요청에 키워드를 함께 보낸다", async () => {
    const user = setupPage();
    await user.type(screen.getByLabelText("방 이름"), "3조 뉴스룸");
    await user.type(screen.getByLabelText("키워드 (선택)"), "지각 대장들");
    await user.click(screen.getByRole("button", { name: "뉴스룸 만들기" }));

    expect(mutateMock).toHaveBeenCalledWith(
      { name: "3조 뉴스룸", keyword: "지각 대장들" },
      expect.anything(),
    );
  });

  it("키워드를 비우면 keyword 없이 요청한다", async () => {
    const user = setupPage();
    await user.type(screen.getByLabelText("방 이름"), "3조 뉴스룸");
    await user.click(screen.getByRole("button", { name: "뉴스룸 만들기" }));

    expect(mutateMock.mock.calls[0][0]).toEqual({
      name: "3조 뉴스룸",
      keyword: undefined,
    });
  });

  it("키워드 입력란은 100자까지만 받는다", async () => {
    setupPage();
    const keywordInput = screen.getByLabelText("키워드 (선택)");

    expect(keywordInput).toHaveAttribute("maxLength", "100");
  });
});

describe("CreateGroupPage 링크 복사", () => {
  it("링크 복사를 누르면 초대 링크 URL을 클립보드에 복사한다", async () => {
    const user = setupPage();
    await createRoom(user);

    await user.click(screen.getByRole("button", { name: /링크 복사/ }));

    expect(writeTextMock).toHaveBeenCalledWith(
      `${window.location.origin}/?invite=7K2Q`,
    );
  });

  it("복사에 성공하면 완료 토스트를 띄운다", async () => {
    const user = setupPage();
    await createRoom(user);

    await user.click(screen.getByRole("button", { name: /링크 복사/ }));

    expect(await screen.findByText("초대 링크를 복사했어요")).toBeVisible();
  });
});
