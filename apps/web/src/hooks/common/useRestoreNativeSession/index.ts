"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!enabled) return;
    if (!isNativeShell) {
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
      request({
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
  }, [enabled, isNativeShell, request]);

  return status;
}
