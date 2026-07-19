import { renderHook, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/common/shared/ui/Toast";
import { useCopyInviteLink } from ".";

const writeTextMock = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  writeTextMock.mockReset();
  writeTextMock.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: writeTextMock },
    configurable: true,
  });
});

describe("useCopyInviteLink", () => {
  it("초대 코드로 만든 링크 URL을 클립보드에 복사한다", async () => {
    const { result } = renderHook(() => useCopyInviteLink(), {
      wrapper: ToastProvider,
    });

    await act(async () => {
      await result.current("7K2Q");
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      `${window.location.origin}/?invite=7K2Q`,
    );
  });

  it("복사 성공 시 완료 토스트를 띄운다", async () => {
    const { result } = renderHook(() => useCopyInviteLink(), {
      wrapper: ToastProvider,
    });

    await act(async () => {
      await result.current("7K2Q");
    });

    expect(await screen.findByText("초대 링크를 복사했어요")).toBeVisible();
  });
});
