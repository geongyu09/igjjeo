import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import {
  ApiError,
  isApiError,
  isAuthError,
  isConnectionError,
  normalizeApiError,
} from "./errors";

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  const err = new AxiosError("Request failed");
  err.response = {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe("normalizeApiError", () => {
  it("표준 에러 봉투를 ApiError로 변환한다", () => {
    const err = normalizeApiError(
      axiosErrorWithResponse(400, {
        error: {
          code: "validation_failed",
          message: "raw_text is required",
          details: { field: "raw_text" },
        },
      }),
    );

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe("validation_failed");
    expect(err.message).toBe("raw_text is required");
    expect(err.details).toEqual({ field: "raw_text" });
  });

  it("응답은 있으나 봉투가 없으면 status 기반 code로 채운다", () => {
    const err = normalizeApiError(axiosErrorWithResponse(404, "Not Found"));

    expect(err.status).toBe(404);
    expect(err.code).toBe("not_found");
  });

  it("응답이 없는 네트워크 오류는 status 0 · network_error", () => {
    const netErr = new AxiosError("Network Error");
    netErr.request = {};
    const err = normalizeApiError(netErr);

    expect(err.status).toBe(0);
    expect(err.code).toBe("network_error");
  });

  it("응답 대기 중 타임아웃이면 status 0 · timeout", () => {
    const timeoutErr = new AxiosError(
      "timeout of 10000ms exceeded",
      AxiosError.ECONNABORTED,
    );
    timeoutErr.request = {};
    const err = normalizeApiError(timeoutErr);

    expect(err.status).toBe(0);
    expect(err.code).toBe("timeout");
  });

  it("ETIMEDOUT 도 timeout 으로 본다", () => {
    const timeoutErr = new AxiosError("timeout", AxiosError.ETIMEDOUT);
    timeoutErr.request = {};
    expect(normalizeApiError(timeoutErr).code).toBe("timeout");
  });

  it("이미 ApiError면 그대로 반환한다", () => {
    const original = new ApiError({
      status: 409,
      code: "conflict",
      message: "x",
    });
    expect(normalizeApiError(original)).toBe(original);
  });

  it("axios가 아닌 알 수 없는 오류는 internal_error로 감싼다", () => {
    const err = normalizeApiError(new Error("boom"));
    expect(err.status).toBe(0);
    expect(err.code).toBe("internal_error");
  });
});

describe("isApiError", () => {
  it("ApiError 인스턴스만 true", () => {
    expect(
      isApiError(new ApiError({ status: 400, code: "x", message: "y" })),
    ).toBe(true);
    expect(isApiError(new Error("nope"))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});

describe("isConnectionError", () => {
  it("서버에 닿지 못한 오류(network_error·timeout)면 true", () => {
    expect(
      isConnectionError(
        new ApiError({ status: 0, code: "network_error", message: "x" }),
      ),
    ).toBe(true);
    expect(
      isConnectionError(
        new ApiError({ status: 0, code: "timeout", message: "x" }),
      ),
    ).toBe(true);
  });

  it("서버가 응답한 오류면 false", () => {
    expect(
      isConnectionError(
        new ApiError({ status: 500, code: "internal_error", message: "x" }),
      ),
    ).toBe(false);
    expect(isConnectionError(new Error("nope"))).toBe(false);
  });
});

describe("isAuthError", () => {
  it("unauthorized·token_expired ApiError면 true", () => {
    expect(
      isAuthError(
        new ApiError({ status: 401, code: "unauthorized", message: "x" }),
      ),
    ).toBe(true);
    expect(
      isAuthError(
        new ApiError({ status: 401, code: "token_expired", message: "x" }),
      ),
    ).toBe(true);
  });

  it("인증과 무관한 ApiError면 false", () => {
    expect(
      isAuthError(
        new ApiError({ status: 404, code: "not_found", message: "x" }),
      ),
    ).toBe(false);
  });

  it("ApiError가 아니면 false", () => {
    expect(isAuthError(new Error("nope"))).toBe(false);
    expect(isAuthError(null)).toBe(false);
  });
});
