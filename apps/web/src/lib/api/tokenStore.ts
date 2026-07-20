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
/**
 * 서버가 세션을 무효로 판정해(401·갱신 실패) 폐기된 상태인지.
 *
 * 세션의 원천은 네이티브 secure-store다. 웹이 토큰만 비우면 네이티브는 같은 죽은 토큰을
 * 그대로 갖고 있어, 복원이 그것을 다시 받아오고 다시 401이 나는 루프에 빠진다. 이 플래그로
 * "이 토큰은 못 쓴다"를 남겨 복원을 막고(useRestoreNativeSession) 네이티브 세션까지
 * 지우도록 알린다(useSyncNativeSessionRevoke). 정상 로그아웃(clear)과는 구분한다.
 */
let revoked = false;

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
    revoked = false;
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

  /**
   * 서버가 거부한 세션을 폐기한다 — 토큰을 비우고 "다시 받아와도 소용없음"을 표시한다.
   * 정상 로그아웃(clear)과 달리, 네이티브가 보관한 같은 토큰으로 복원하는 것을 막는다.
   */
  revoke(): void {
    hydrate();
    accessToken = null;
    refreshToken = null;
    revoked = true;
    const storage = getStorage();
    storage?.removeItem(ACCESS_KEY);
    storage?.removeItem(REFRESH_KEY);
    notify();
  },

  /** 세션이 폐기된 상태인지. 새 세션을 set 하면 해제된다. */
  isRevoked(): boolean {
    return revoked;
  },

  /** 메모리 캐시를 버리고 다음 접근 때 저장소에서 다시 읽게 한다(테스트·다탭 동기화용). */
  reset(): void {
    accessToken = null;
    refreshToken = null;
    revoked = false;
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
