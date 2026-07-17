/**
 * 백엔드 HTTP API 호출용 axios 인스턴스.
 *
 * - baseURL: `NEXT_PUBLIC_API_BASE_URL`(예 `http://localhost:4000/v1`). 모든 경로는 `/v1` 하위.
 * - 요청 인터셉터: 액세스 토큰이 있으면 `Authorization: Bearer` 주입.
 * - 응답 인터셉터: `401 token_expired`면 리프레시로 1회 재발급·재시도(동시 401은 단일 refresh로 dedup),
 *   그 외 오류는 표준 봉투를 ApiError로 정규화해 reject.
 *
 * 데이터 접근 계층(`src/lib/data/*`)만 이 인스턴스를 사용한다. 컴포넌트·훅은 데이터 계층을 경유한다.
 */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError, isApiError, normalizeApiError } from "./errors";
import { tokenStore, type TokenPair } from "./tokenStore";

// NEXT_PUBLIC_* 은 리터럴 접근일 때만 빌드 타임 인라인되므로 모듈 스코프에서 리터럴로 읽는다.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/** 요청 인터셉터: 저장된 액세스 토큰을 Authorization 헤더로 주입한다. */
export function attachAuthHeader(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
}

apiClient.interceptors.request.use(attachAuthHeader);

// ── 토큰 갱신 (동시 401 dedup) ──────────────────────────────────

let refreshPromise: Promise<TokenPair> | null = null;

/**
 * 리프레시 토큰으로 새 토큰 번들을 발급받아 저장한다.
 * 인터셉터 재귀를 피하려고 bare axios로 호출한다. 동시 호출은 하나의 refresh로 합친다.
 */
async function refreshTokens(): Promise<TokenPair> {
  if (refreshPromise) return refreshPromise;

  const refresh_token = tokenStore.getRefreshToken();
  if (!refresh_token) {
    throw new ApiError({
      status: 401,
      code: "unauthorized",
      message: "리프레시 토큰이 없습니다",
    });
  }

  refreshPromise = axios
    .post<TokenPair>(
      `${API_BASE_URL}/auth/token/refresh`,
      { refresh_token },
      { headers: { "Content-Type": "application/json" } },
    )
    .then((res) => {
      const pair: TokenPair = {
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
      };
      tokenStore.set(pair);
      return pair;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

function isTokenExpired(error: AxiosError): boolean {
  const data = error.response?.data as
    | { error?: { code?: string } }
    | undefined;
  return error.response?.status === 401 && data?.error?.code === "token_expired";
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;

    // 만료된 액세스 토큰 → 1회 갱신 후 재시도
    if (config && !config._retried && isTokenExpired(error)) {
      config._retried = true;
      try {
        const { access_token } = await refreshTokens();
        config.headers.set("Authorization", `Bearer ${access_token}`);
        return apiClient(config);
      } catch (refreshError) {
        // 갱신 실패 → 세션 폐기하고 원 오류 계열로 reject
        tokenStore.clear();
        return Promise.reject(
          isApiError(refreshError)
            ? refreshError
            : normalizeApiError(refreshError),
        );
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);
