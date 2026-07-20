import * as SecureStore from "expo-secure-store";

// 첫 진입 온보딩(웹 /onboarding 설명 4장)을 봤는지 여부. 온보딩은 로그인 전에 뜨는 화면이라
// 초기 라우트를 정하는 네이티브가 이 값을 알아야 한다 — 웹 localStorage가 아니라 여기에 영속한다.
// 민감 정보는 아니지만, AsyncStorage를 새로 넣으면 dev client 재빌드가 필요하므로 이미 쓰고 있는
// secure-store를 그대로 쓴다(sessionStore와 같은 저장소).

const KEY = "igjjeo.onboarding_done";
const DONE = "1";

// 메모리 캐시 — 최초 접근 시 secure-store 에서 1회 로드.
let cache: boolean | null = null;

export const onboardingStore = {
  /** 온보딩을 이미 봤는지 읽는다(캐시 있으면 캐시). */
  async load(): Promise<boolean> {
    if (cache !== null) return cache;
    cache = (await SecureStore.getItemAsync(KEY)) === DONE;
    return cache;
  },

  /** 동기 조회 — load()/markDone() 이후에만 신뢰. */
  peek(): boolean {
    return cache ?? false;
  },

  async markDone(): Promise<void> {
    cache = true;
    await SecureStore.setItemAsync(KEY, DONE);
  },

  async clear(): Promise<void> {
    cache = false;
    await SecureStore.deleteItemAsync(KEY);
  },
};
