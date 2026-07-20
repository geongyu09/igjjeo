/**
 * 대기 중인 초대 코드 저장소.
 *
 * 앱(네이티브 셸)에서 초대 딥링크로 들어왔을 때, 로그인·온보딩을 거치는 동안 초대 코드를
 * 잃지 않도록 잠시 보관한다. 세션이 준비되면 PendingInviteConsumer가 이 값으로 방에
 * 자동 참여하고 값을 비운다.
 *
 * activeGroupStore와 같은 external store 패턴(localStorage + 메모리 캐시 + subscribe)이라
 * useSyncExternalStore로 반응형 구독이 된다. 코드는 저장 시 normalizeInviteCode로 정규화한다.
 */

import { normalizeInviteCode } from "@/lib/invite";

const KEY = "igjjeo.pending_invite";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let pendingInvite: string | null = null;
let hydrated = false;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const storage = getStorage();
  if (!storage) return;
  pendingInvite = normalizeInviteCode(storage.getItem(KEY));
}

export const pendingInviteStore = {
  get(): string | null {
    hydrate();
    return pendingInvite;
  },

  /** 초대 코드를 정규화해 저장한다. 유효하지 않으면 아무 것도 하지 않는다. */
  set(rawCode: string): void {
    hydrate();
    const code = normalizeInviteCode(rawCode);
    if (!code || code === pendingInvite) return;
    pendingInvite = code;
    getStorage()?.setItem(KEY, code);
    notify();
  },

  clear(): void {
    hydrate();
    if (pendingInvite === null) return;
    pendingInvite = null;
    getStorage()?.removeItem(KEY);
    notify();
  },

  /** 메모리 캐시를 버리고 다음 접근 때 저장소에서 다시 읽게 한다(테스트·다탭 동기화용). */
  reset(): void {
    pendingInvite = null;
    hydrated = false;
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
