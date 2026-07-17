/**
 * 세션 토큰(JWT) 저장소. axios 인터셉터가 Authorization 헤더 주입·토큰 갱신에 사용한다.
 *
 * 프로토타입 저장 위치는 localStorage(웹뷰 셸 전제). SSR·비브라우저 환경에서는 메모리만 사용한다.
 * 자체 인증(auth-profile.md) 전용 — Supabase Auth 세션과는 별개다.
 */

const ACCESS_KEY = "igjjeo.access_token";
const REFRESH_KEY = "igjjeo.refresh_token";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // 프라이버시 모드 등에서 접근이 막히면 메모리 캐시만 사용
    return null;
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let hydrated = false;

/** 토큰 변경 구독자 — useSyncExternalStore 기반 세션 게이트가 반응하도록. */
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** 첫 접근 시 localStorage에서 메모리 캐시로 1회 로드한다. */
function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const storage = getStorage();
  if (!storage) return;
  accessToken = storage.getItem(ACCESS_KEY);
  refreshToken = storage.getItem(REFRESH_KEY);
}

export const tokenStore = {
  getAccessToken(): string | null {
    hydrate();
    return accessToken;
  },

  getRefreshToken(): string | null {
    hydrate();
    return refreshToken;
  },

  set({ access_token, refresh_token }: TokenPair): void {
    hydrate();
    accessToken = access_token;
    refreshToken = refresh_token;
    const storage = getStorage();
    storage?.setItem(ACCESS_KEY, access_token);
    storage?.setItem(REFRESH_KEY, refresh_token);
    notify();
  },

  clear(): void {
    hydrate();
    accessToken = null;
    refreshToken = null;
    const storage = getStorage();
    storage?.removeItem(ACCESS_KEY);
    storage?.removeItem(REFRESH_KEY);
    notify();
  },

  /** 메모리 캐시를 버리고 다음 접근 때 저장소에서 다시 읽게 한다(테스트·다탭 동기화용). */
  reset(): void {
    accessToken = null;
    refreshToken = null;
    hydrated = false;
    notify();
  },

  /** 토큰 변경을 구독한다. 반환된 함수로 해제. useSyncExternalStore 계약을 따른다. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
