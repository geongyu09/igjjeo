/**
 * 활성 방(현재 보고 있는 방)의 id 저장소.
 *
 * 방 선택은 웹이 소유한다 — `/group` 방 허브에서 방을 고르면 이 값이 정해지고, 피드·제보 등
 * 방-스코프 화면이 이 값으로 대상 방을 결정한다. tokenStore와 같은 external store 패턴
 * (localStorage + 메모리 캐시 + subscribe)이라 useSyncExternalStore로 반응형 구독이 된다.
 *
 * 저장 위치는 localStorage(웹뷰 셸 전제) — 같은 origin의 WebView끼리 공유·영속되므로,
 * 방 허브 WebView에서 고른 방을 탭(피드) WebView가 그대로 읽는다. SSR·비브라우저에서는
 * 메모리만 사용한다.
 */

const KEY = "igjjeo.active_group_id";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // 프라이버시 모드 등에서 접근이 막히면 메모리 캐시만 사용
    return null;
  }
}

let activeGroupId: string | null = null;
let hydrated = false;

/** 변경 구독자 — useSyncExternalStore 기반 훅이 반응하도록. */
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
  activeGroupId = storage.getItem(KEY);
}

export const activeGroupStore = {
  get(): string | null {
    hydrate();
    return activeGroupId;
  },

  set(id: string): void {
    hydrate();
    activeGroupId = id;
    getStorage()?.setItem(KEY, id);
    notify();
  },

  clear(): void {
    hydrate();
    activeGroupId = null;
    getStorage()?.removeItem(KEY);
    notify();
  },

  /** 메모리 캐시를 버리고 다음 접근 때 저장소에서 다시 읽게 한다(테스트·다탭 동기화용). */
  reset(): void {
    activeGroupId = null;
    hydrated = false;
    notify();
  },

  /** 변경을 구독한다. 반환된 함수로 해제. useSyncExternalStore 계약을 따른다. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
