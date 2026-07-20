import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { mutate, state } = vi.hoisted(() => ({
  mutate: vi.fn(),
  state: { isPending: false },
}));

vi.mock(
  "@/hooks/features/query/mutations/useRequestCorrectionMutation",
  () => ({
    useRequestCorrectionMutation: () => ({
      mutate,
      isPending: state.isPending,
    }),
  }),
);

import { ApiError } from "@/lib/api/errors";
import { useCorrectionRequest } from "./index";

const INPUT = { isSubject: true, correctionText: "사실 9시 58분 도착" };

/** mutate 에 넘어간 (params, callbacks) 를 꺼낸다. */
function lastCall() {
  const [params, callbacks] = mutate.mock.calls[mutate.mock.calls.length - 1];
  return { params, callbacks } as {
    params: Record<string, unknown>;
    callbacks: { onSuccess?: () => void; onError?: (error: unknown) => void };
  };
}

describe("useCorrectionRequest", () => {
  beforeEach(() => {
    mutate.mockClear();
    state.isPending = false;
  });

  it("open/close 로 시트 열림을 관리한다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("정정 요청을 기사·유형·내용과 멱등 키로 보낸다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    act(() => result.current.submit(INPUT));

    expect(lastCall().params).toMatchObject({
      articleId: "a1",
      isSubject: true,
      correctionText: "사실 9시 58분 도착",
    });
    expect(lastCall().params.idempotencyKey).toEqual(expect.any(String));
  });

  it("성공하면 시트를 닫는다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    act(() => result.current.open());
    act(() => result.current.submit(INPUT));
    act(() => lastCall().callbacks.onSuccess?.());

    expect(result.current.isOpen).toBe(false);
  });

  it("실패해도 시트를 열어 두고 안내 문구를 보여준다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    act(() => result.current.open());
    act(() => result.current.submit(INPUT));
    act(() =>
      lastCall().callbacks.onError?.(
        new ApiError({
          status: 429,
          code: "rate_limited",
          message: "하루 정정 한도(5회)를 모두 사용했어요",
        }),
      ),
    );

    expect(result.current.isOpen).toBe(true);
    expect(result.current.errorMessage).toBe(
      "하루 정정 한도(5회)를 모두 사용했어요",
    );
  });

  it("각색 거부는 이유를 알려준다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    act(() => result.current.submit(INPUT));
    act(() =>
      lastCall().callbacks.onError?.(
        new ApiError({
          status: 422,
          code: "adaptation_refused",
          message: "refused",
        }),
      ),
    );

    expect(result.current.errorMessage).toContain("각색");
  });

  it("각색 거부 뒤에는 멱등 키를 버려, 고쳐 쓴 내용이 최초 결과에 묻히지 않게 한다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    act(() => result.current.submit(INPUT));
    const first = lastCall().params.idempotencyKey;
    act(() =>
      lastCall().callbacks.onError?.(
        new ApiError({
          status: 422,
          code: "adaptation_refused",
          message: "refused",
        }),
      ),
    );
    act(() =>
      result.current.submit({ ...INPUT, correctionText: "고쳐 쓴 내용" }),
    );

    expect(lastCall().params.idempotencyKey).not.toBe(first);
  });

  it("재시도는 같은 멱등 키를 유지해 각색이 두 번 돌지 않게 한다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    act(() => result.current.submit(INPUT));
    const first = lastCall().params.idempotencyKey;
    act(() =>
      lastCall().callbacks.onError?.(
        new ApiError({ status: 503, code: "ai_unavailable", message: "down" }),
      ),
    );
    act(() => result.current.submit(INPUT));

    expect(lastCall().params.idempotencyKey).toBe(first);
  });

  it("시트를 다시 열면 새 멱등 키를 쓴다", () => {
    const { result } = renderHook(() =>
      useCorrectionRequest({ articleId: "a1" }),
    );

    act(() => result.current.submit(INPUT));
    const first = lastCall().params.idempotencyKey;
    act(() => result.current.close());
    act(() => result.current.open());
    act(() => result.current.submit(INPUT));

    expect(lastCall().params.idempotencyKey).not.toBe(first);
  });
});
