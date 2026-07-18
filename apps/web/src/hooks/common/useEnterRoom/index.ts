"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useCallback } from "react";
import { useStackLinkRouter } from "stack-link";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";
import { activeGroupStore } from "@/lib/session/activeGroupStore";

/**
 * 방에 진입한다 — 고른 방을 활성 방으로 정하고 방 안(하단 탭 화면)으로 들어간다
 * (webview-architecture 네비게이션 플로우).
 *
 * - 먼저 activeGroupStore에 활성 방을 기록한다. 피드 등 방-스코프 화면은 이 값을 읽는다.
 * - 네이티브 셸(앱 WebView): @geongyu/react-native-bridge로 네이티브에 탭 화면(Tabs) 전환을
 *   요청한다. 새 탭 WebView(피드)는 같은 origin의 activeGroupStore(localStorage)에서 방을 읽는다.
 * - 브라우저 프로토타입: 네이티브 탭이 없으므로 stack-link로 피드(/)로 이동한다(웹 탭 바가 그려진다).
 *
 * 반환 함수는 진입할 방의 id를 받는다.
 */
export function useEnterRoom() {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const { navigate } = useStackLinkRouter({});

  return useCallback(
    (groupId: string) => {
      activeGroupStore.set(groupId);
      if (isNativeShell) {
        // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
        request({
          requestMessage: { type: "enterRoom", payload: { groupId } },
        });
        return;
      }
      navigate({ href: "/", animation: "none" });
    },
    [isNativeShell, request, navigate],
  );
}
