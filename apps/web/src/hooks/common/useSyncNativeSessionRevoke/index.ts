"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";
import { tokenStore } from "@/lib/api/tokenStore";

/**
 * 웹이 세션을 폐기하면(401·갱신 실패) 네이티브가 보관한 세션도 함께 지우게 한다.
 *
 * 세션의 원천은 네이티브 secure-store다. 웹만 토큰을 비우면 네이티브는 같은 죽은 토큰을
 * 그대로 갖고 있어, 세션 게이트가 복원으로 그것을 다시 받아오고 다시 401이 나는 루프에
 * 빠진다(화면은 "세션 확인 중"에서 벗어나지 못한다). 폐기를 네이티브까지 전파해 루프를 끊고,
 * 네이티브는 세션을 지우며 로그인 화면으로 되돌린다.
 *
 * 브리지 handshake 를 하는 최상위 프레임에서 한 번만 마운트한다(NativeBackListener).
 * 응답은 필요 없으므로 responseCallback 을 넘기지 않는다(geongyu-bridge 주의사항 9번).
 */
export function useSyncNativeSessionRevoke(): void {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const isRevoked = useSyncExternalStore(
    tokenStore.subscribe,
    tokenStore.isRevoked,
    () => false,
  );

  // useBridge 의 request 는 렌더마다 새 identity 라 effect 의존성에 넣으면 리렌더마다
  // 재실행된다. 최신 참조만 ref 로 들고 effect 는 실제 상태 변화에만 반응시킨다.
  const requestRef = useRef(request);
  useEffect(() => {
    requestRef.current = request;
  });

  // 폐기 1회당 한 번만 보낸다. 재로그인 후 다시 폐기되면 또 보낸다.
  const sentRef = useRef(false);
  useEffect(() => {
    if (!isRevoked) {
      sentRef.current = false;
      return;
    }
    if (!isNativeShell || sentRef.current) return;
    sentRef.current = true;
    requestRef.current({ requestMessage: { type: "clearSession" } });
  }, [isRevoked, isNativeShell]);
}
