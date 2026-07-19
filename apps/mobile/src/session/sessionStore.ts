import * as SecureStore from "expo-secure-store";

import type { SessionTokens } from "@igjjeo/bridge-contract";

// 네이티브가 소유하는 세션 토큰의 원천 저장소. 로그인은 네이티브(Google/Apple)가 하고,
// 그 세션을 여기(secure-store)에 보관한다. 탭 WebView(웹)는 브리지 getSession 으로 이 값을
// 받아 자신의 저장소에 넣는다. 앱 재실행 시 이 값이 있으면 로그인을 건너뛴다.

const ACCESS_KEY = "igjjeo.access_token";
const REFRESH_KEY = "igjjeo.refresh_token";

// 메모리 캐시 — 브리지 getSession 이 빠르게 읽도록. 최초 접근 시 secure-store 에서 1회 로드.
let cache: SessionTokens | null = null;
let hydrated = false;

async function hydrate(): Promise<SessionTokens | null> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  cache =
    access && refresh ? { access_token: access, refresh_token: refresh } : null;
  hydrated = true;
  return cache;
}

export const sessionStore = {
  /** secure-store 에서 세션을 읽어 반환한다(캐시 있으면 캐시). 없으면 null. */
  async load(): Promise<SessionTokens | null> {
    return hydrated ? cache : hydrate();
  },

  /** 동기 조회 — load()/set() 이후에만 신뢰. 브리지 핸들러 등 빠른 경로용. */
  peek(): SessionTokens | null {
    return cache;
  },

  async set(tokens: SessionTokens): Promise<void> {
    cache = tokens;
    hydrated = true;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.access_token),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh_token),
    ]);
  },

  async clear(): Promise<void> {
    cache = null;
    hydrated = true;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
