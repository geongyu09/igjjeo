import { useEffect, useState } from "react";

import { onboardingStore } from "../session/onboardingStore";
import { sessionStore } from "../session/sessionStore";
import type { RootStackParamList } from "./types";

type InitialRoute = Extract<keyof RootStackParamList, "Onboarding" | "Login">;

/**
 * 루트 스택의 초기 라우트를 정한다 — 앱을 처음 연 사람에게만 온보딩(웹 설명 4장)을 보여주고,
 * 이미 봤거나 세션이 있으면 로그인 화면부터 시작한다(로그인 화면은 세션이 있으면 스스로
 * 방 허브로 넘어간다 — LoginSection).
 *
 * 두 값 모두 secure-store 비동기 조회라, 결정 전에는 null 을 반환한다. 네비게이터의
 * initialRouteName 은 마운트 후 바꿔도 반영되지 않으므로, 호출부는 null 인 동안 네비게이터를
 * 렌더하지 않아야 한다.
 */
export function useInitialRouteName(): InitialRoute | null {
  const [route, setRoute] = useState<InitialRoute | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([sessionStore.load(), onboardingStore.load()]).then(
      ([session, onboardingDone]) => {
        if (!active) return;
        setRoute(session || onboardingDone ? "Login" : "Onboarding");
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return route;
}
