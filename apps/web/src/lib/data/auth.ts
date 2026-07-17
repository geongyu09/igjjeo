/**
 * 인증 데이터 접근 계층 (auth-profile.md).
 * 토큰 발급/회전은 여기서 tokenStore에 반영한다. 화면·훅은 이 함수 시그니처에만 의존한다.
 */

import { apiClient } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/tokenStore";
import type { AuthResult, TokenBundle } from "@/lib/api/types";

export interface SignupParams {
  email: string;
  password: string;
  displayName: string;
}

export async function signup({
  email,
  password,
  displayName,
}: SignupParams): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>("/auth/signup", {
    email,
    password,
    display_name: displayName,
  });
  tokenStore.set(data);
  return data;
}

export interface LoginParams {
  email: string;
  password: string;
}

export async function login({
  email,
  password,
}: LoginParams): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>("/auth/login", {
    email,
    password,
  });
  tokenStore.set(data);
  return data;
}

/** 리프레시 토큰으로 새 토큰 번들을 발급받아 저장한다(회전식). */
export async function refreshToken(): Promise<TokenBundle> {
  const refresh_token = tokenStore.getRefreshToken();
  const { data } = await apiClient.post<TokenBundle>("/auth/token/refresh", {
    refresh_token,
  });
  tokenStore.set(data);
  return data;
}

/** 현재 세션 리프레시 토큰을 무효화하고 로컬 토큰을 비운다. */
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    tokenStore.clear();
  }
}
