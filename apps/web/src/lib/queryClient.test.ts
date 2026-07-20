import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { makeQueryClient } from "./queryClient";

function retryOf(error: unknown, failureCount: number): boolean {
  const retry = makeQueryClient().getDefaultOptions().queries?.retry;
  if (typeof retry !== "function") {
    throw new Error("queries.retry 는 함수여야 합니다");
  }
  return retry(failureCount, error as Error) as boolean;
}

describe("makeQueryClient 재시도 정책", () => {
  it("4xx 는 재시도하지 않는다", () => {
    const error = new ApiError({
      status: 404,
      code: "not_found",
      message: "x",
    });
    expect(retryOf(error, 0)).toBe(false);
  });

  it("5xx 는 두 번까지 재시도한다", () => {
    const error = new ApiError({
      status: 500,
      code: "internal_error",
      message: "x",
    });
    expect(retryOf(error, 0)).toBe(true);
    expect(retryOf(error, 1)).toBe(true);
    expect(retryOf(error, 2)).toBe(false);
  });

  it("연결 실패는 한 번만 재시도한다", () => {
    // 요청마다 타임아웃까지 기다리므로 재시도를 겹치면 로딩이 몇 배로 길어진다.
    // 주소가 잘못됐거나 서버가 죽었다면 재시도해도 결과가 같다 — 빨리 오류를 보여준다.
    const error = new ApiError({ status: 0, code: "timeout", message: "x" });
    expect(retryOf(error, 0)).toBe(true);
    expect(retryOf(error, 1)).toBe(false);
  });

  it("네트워크 오류도 한 번만 재시도한다", () => {
    const error = new ApiError({
      status: 0,
      code: "network_error",
      message: "x",
    });
    expect(retryOf(error, 0)).toBe(true);
    expect(retryOf(error, 1)).toBe(false);
  });
});
