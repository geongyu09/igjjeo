/**
 * 첫 진입 온보딩(설명 4장)을 이미 봤는지 여부 저장소.
 *
 * 앱을 처음 열었을 때 한 번만 온보딩을 보여주기 위한 로컬 플래그다. 계정이 아니라 기기에
 * 묶이는 값이라 서버에 두지 않는다. activeGroupStore와 같은 external store 패턴
 * (localStorage + 메모리 캐시 + subscribe)이라 useSyncExternalStore로 반응형 구독이 된다.
 *
 * SSR·비브라우저에서는 메모리만 사용한다.
 */

const KEY = "igjjeo.onboarding_done";
const DONE = "1";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // 프라이버시 모드 등에서 접근이 막히면 메모리 캐시만 사용
    return null;
  }
}

let done = false;
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
  done = storage.getItem(KEY) === DONE;
}

export const onboardingStore = {
  get(): boolean {
    hydrate();
    return done;
  },

  markDone(): void {
    hydrate();
    if (done) return;
    done = true;
    getStorage()?.setItem(KEY, DONE);
    notify();
  },

  clear(): void {
    hydrate();
    if (!done) return;
    done = false;
    getStorage()?.removeItem(KEY);
    notify();
  },

  /** 메모리 캐시를 버리고 다음 접근 때 저장소에서 다시 읽게 한다(테스트·다탭 동기화용). */
  reset(): void {
    done = false;
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
