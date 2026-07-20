import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { mutate, state } = vi.hoisted(() => ({
  mutate: vi.fn(),
  state: { isPending: false },
}));

vi.mock("@/hooks/features/query/mutations/useRequestDeletionMutation", () => ({
  useRequestDeletionMutation: () => ({ mutate, isPending: state.isPending }),
}));

import { ApiError } from "@/lib/api/errors";
import { useArticleDeletion } from "./index";

function lastCall() {
  const [params, callbacks] = mutate.mock.calls[mutate.mock.calls.length - 1];
  return { params, callbacks } as {
    params: Record<string, unknown>;
    callbacks: { onSuccess?: () => void; onError?: (error: unknown) => void };
  };
}

describe("useArticleDeletion", () => {
  beforeEach(() => {
    mutate.mockClear();
    state.isPending = false;
  });

  it("open/close 로 확인 다이얼로그를 관리한다", () => {
    const { result } = renderHook(() =>
      useArticleDeletion({ articleId: "a1", groupId: "g1" }),
    );

    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("기사·방과 멱등 키로 삭제를 요청한다", () => {
    const { result } = renderHook(() =>
      useArticleDeletion({ articleId: "a1", groupId: "g1" }),
    );

    act(() => result.current.submit());

    expect(lastCall().params).toMatchObject({
      articleId: "a1",
      groupId: "g1",
    });
    expect(lastCall().params.idempotencyKey).toEqual(expect.any(String));
  });

  it("내려간 뒤에는 다이얼로그를 닫고 onDeleted 를 부른다", () => {
    const onDeleted = vi.fn();
    const { result } = renderHook(() =>
      useArticleDeletion({ articleId: "a1", groupId: "g1", onDeleted }),
    );

    act(() => result.current.open());
    act(() => result.current.submit());
    act(() => lastCall().callbacks.onSuccess?.());

    expect(result.current.isOpen).toBe(false);
    expect(onDeleted).toHaveBeenCalled();
  });

  it("재시도는 같은 멱등 키를 유지해 두 번 기록되지 않게 한다", () => {
    const { result } = renderHook(() =>
      useArticleDeletion({ articleId: "a1", groupId: "g1" }),
    );

    act(() => result.current.submit());
    const first = lastCall().params.idempotencyKey;
    act(() => lastCall().callbacks.onError?.(new Error("network")));
    act(() => result.current.submit());

    expect(lastCall().params.idempotencyKey).toBe(first);
  });

  it("제보자가 아니면 서버가 막았다는 안내를 보여준다", () => {
    const onDeleted = vi.fn();
    const { result } = renderHook(() =>
      useArticleDeletion({ articleId: "a1", groupId: "g1", onDeleted }),
    );

    act(() => result.current.open());
    act(() => result.current.submit());
    act(() =>
      lastCall().callbacks.onError?.(
        new ApiError({
          status: 403,
          code: "forbidden",
          message: "기사를 올린 사람만 내릴 수 있어요",
        }),
      ),
    );

    expect(result.current.errorMessage).toBe(
      "기사를 올린 사람만 내릴 수 있어요",
    );
    expect(result.current.isOpen).toBe(true);
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
