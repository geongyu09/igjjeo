import { StackActions } from "@react-navigation/native";
import { useEffect } from "react";
import { Linking } from "react-native";

import { inviteWebPath, parseInviteFromUrl } from "../lib/deepLink";
import { pendingInviteStore } from "../session/pendingInviteStore";
import { sessionStore } from "../session/sessionStore";
import { navigationRef } from "./navigationRef";

// 초대 딥링크(Universal/App Link 또는 커스텀 스킴)를 받아 방 참여 흐름으로 라우팅한다.
//
// - 이미 로그인돼 있고 네비게이션이 준비됐으면: 바로 방 허브를 초대 코드와 함께 연다
//   (`/group?invite=코드`). 웹(InviteGate→PendingInviteConsumer)이 그 코드로 자동 참여한다.
// - 아직 로그인 전(콜드 스타트 등)이면: 코드를 pendingInviteStore에 보관한다. 로그인 성공 뒤
//   LoginSection.enterApp이 이 코드를 읽어 같은 초대 라우트로 진입한다.
async function handleUrl(url: string): Promise<void> {
  const code = parseInviteFromUrl(url);
  if (!code) return;

  const session = await sessionStore.load();
  if (session && navigationRef.isReady()) {
    pendingInviteStore.clear();
    navigationRef.dispatch(
      StackActions.replace("WebScreen", { url: inviteWebPath(code) }),
    );
    return;
  }
  // 로그인 전 — 로그인 성공 후 enterApp이 소비한다.
  pendingInviteStore.set(code);
}

/**
 * 앱 시작 시의 초기 URL과 실행 중 들어오는 URL 이벤트를 구독해 초대 딥링크를 처리한다.
 * App 루트에서 한 번 호출한다.
 */
export function useInviteDeepLink(): void {
  useEffect(() => {
    let active = true;

    void Linking.getInitialURL().then((url) => {
      if (active && url) void handleUrl(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
}
