import type { SessionTokens } from "@igjjeo/bridge-contract";

import { API_BASE_URL } from "../config/env";

export interface OAuthLoginParams {
  provider: "google" | "apple";
  idToken: string;
  /** 신규 가입 시 초기 표시 이름 프리필(예: Apple 최초 동의 시 전달되는 이름). */
  name?: string;
}

// 서버 응답까지 기다릴 최대 시간. API_BASE_URL 이 잘못돼(예: 실기기에서 localhost)
// 서버에 도달하지 못하면 fetch 는 OS 타임아웃까지 무한 대기해 로그인 화면이 멈춘 것처럼
// 보인다. 이 상한을 두면 그 경우 abort 되어 호출부(LoginSection)의 catch 가 실패로 처리한다.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * 소셜 id_token 을 백엔드(POST /v1/auth/oauth)로 넘겨 자체 세션 토큰을 발급받는다.
 * 프로필·onboarded 는 웹이 /me 로 조회하므로 여기서는 세션 토큰만 반환한다.
 */
export async function oauthLogin(
  params: OAuthLoginParams,
): Promise<SessionTokens> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: params.provider,
        id_token: params.idToken,
        name: params.name,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    // abort 로 끊긴 경우와 그 외 네트워크 오류를 구분해 메시지를 남긴다.
    if (controller.signal.aborted) {
      throw new Error(
        `소셜 로그인 요청 시간 초과 — 서버(${API_BASE_URL})에 도달하지 못했습니다`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`소셜 로그인 실패 (${res.status})`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
  };
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}
