"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useEffect, useRef, useState } from "react";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";
import { tokenStore } from "@/lib/api/tokenStore";

export type RestoreStatus = "restoring" | "unavailable";

// 브리지는 handshake 완료 전 요청이 유실되고 타임아웃이 없다(geongyu-bridge 주의사항 3·4).
// 응답이 올 때까지 짧은 간격으로 재시도한다.
const RETRY_INTERVAL_MS = 300;
const MAX_ATTEMPTS = 10;

/**
 * 네이티브가 소유한 세션을 브리지 `getSession` 으로 받아 tokenStore 에 넣는다.
 *
 * 로그인은 네이티브(Google/Apple)가 담당하므로 세션의 원천은 네이티브다. 웹은 부팅 시
 * 이 훅으로 세션을 동기화한다 — 성공하면 tokenStore.set 이 세션 상태를 뒤집어 상위 게이트가
 * 앱으로 전환한다. 네이티브 셸이 아니거나(브라우저) 네이티브에 세션이 없으면 `unavailable`.
 *
 * @param enabled 세션이 없어 복원이 필요한 동안에만 true (게이트가 제어).
 */
export function useRestoreNativeSession({
  enabled,
}: {
  enabled: boolean;
}): RestoreStatus {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const [status, setStatus] = useState<RestoreStatus>("restoring");

  // useBridge 의 request 는 렌더마다 새 함수 identity 를 갖는다(라이브러리가 memoize 하지 않음).
  // 이를 effect 의존성에 넣으면 리렌더(핸드셰이크 완료 등)마다 effect 가 재실행되며 재시도
  // 카운터·settled 가 리셋돼 MAX_ATTEMPTS 안전장치가 무력화되고, 진행 중 응답이 유실돼
  // "restoring"(세션 확인 중)에 영구히 갇힐 수 있다. 최신 request 만 ref 로 참조하고 effect 는
  // enabled/isNativeShell 에만 의존시켜 재시도 루프가 한 번만 끝까지 돌게 한다.
  const requestRef = useRef(request);
  useEffect(() => {
    requestRef.current = request;
  });

  useEffect(() => {
    if (!enabled) return;
    if (!isNativeShell) {
      setStatus("unavailable");
      return;
    }
    // 서버가 거부한 세션을 방금 폐기했다면 복원하지 않는다. 네이티브 secure-store 에는 아직
    // 같은 죽은 토큰이 남아 있어, 지금 요청하면 그것을 되받아 401 → 폐기 → 복원 루프에
    // 빠진다("세션 확인 중" 무한 로딩). 네이티브 세션은 useSyncNativeSessionRevoke 가 지운다.
    if (tokenStore.isRevoked()) {
      setStatus("unavailable");
      return;
    }

    setStatus("restoring");
    let settled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const finish = (next?: RestoreStatus) => {
      settled = true;
      clearTimeout(timer);
      if (next) setStatus(next);
    };

    const attempt = () => {
      if (settled) return;
      attempts += 1;
      requestRef.current({
        requestMessage: { type: "getSession" },
        responseCallback: (res) => {
          if (settled) return;
          if (res?.session) {
            // tokenStore.set 이 useHasSession 을 뒤집어 게이트가 앱으로 전환한다.
            finish();
            tokenStore.set(res.session);
          } else {
            // 네이티브에 세션이 없음(정상 흐름에선 드묾 — 로그인 자체가 네이티브 게이트).
            finish("unavailable");
          }
        },
      });
      timer = setTimeout(
        attempts >= MAX_ATTEMPTS
          ? () => {
              if (!settled) finish("unavailable");
            }
          : attempt,
        RETRY_INTERVAL_MS,
      );
    };

    attempt();
    return () => {
      settled = true;
      clearTimeout(timer);
    };
  }, [enabled, isNativeShell]);

  return status;
}
