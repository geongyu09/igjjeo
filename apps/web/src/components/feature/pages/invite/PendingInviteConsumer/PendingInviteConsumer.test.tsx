import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/common/shared/ui/Toast";
import { pendingInviteStore } from "@/lib/session/pendingInviteStore";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    mutate: vi.fn(),
    enterRoom: vi.fn(),
    isPending: false,
  },
}));

vi.mock("@/hooks/features/query/mutations/useJoinGroupMutation", () => ({
  useJoinGroupMutation: () => ({
    mutate: mocks.mutate,
    isPending: mocks.isPending,
  }),
}));

vi.mock("@/hooks/common/useEnterRoom", () => ({
  useEnterRoom: () => mocks.enterRoom,
}));

import { PendingInviteConsumer } from ".";

function renderConsumer() {
  return render(<PendingInviteConsumer />, { wrapper: ToastProvider });
}

beforeEach(() => {
  localStorage.clear();
  pendingInviteStore.reset();
  mocks.mutate.mockReset();
  mocks.enterRoom.mockReset();
  mocks.isPending = false;
});

describe("PendingInviteConsumer", () => {
  it("대기 코드가 없으면 참여를 시도하지 않는다", () => {
    renderConsumer();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it("대기 코드가 있으면 그 코드로 방 참여를 시도한다", () => {
    pendingInviteStore.set("B3QFNS");
    renderConsumer();
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.mutate.mock.calls[0][0]).toEqual({ inviteCode: "B3QFNS" });
  });

  it("참여 성공 시 그 방으로 진입시키고 대기 코드를 비운다", () => {
    mocks.mutate.mockImplementation((_params, options) => {
      options.onSuccess({ id: "g1" });
    });
    pendingInviteStore.set("B3QFNS");
    renderConsumer();
    expect(mocks.enterRoom).toHaveBeenCalledWith("g1");
    expect(pendingInviteStore.get()).toBeNull();
  });

  it("참여 실패 시 대기 코드를 비워 반복을 막는다", () => {
    mocks.mutate.mockImplementation((_params, options) => {
      options.onError(new Error("nope"));
    });
    pendingInviteStore.set("B3QFNS");
    renderConsumer();
    expect(mocks.enterRoom).not.toHaveBeenCalled();
    expect(pendingInviteStore.get()).toBeNull();
  });
});
