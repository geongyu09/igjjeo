"use client";

import { useSyncExternalStore } from "react";
import {
  type InstallPlatform,
  resolveInstallPlatform,
} from "@/lib/install/resolveInstallTarget";

/**
 * 현재 기기의 설치 플랫폼(ios·android·other)을 판별한다.
 * SSR에서는 other로 렌더되고 하이드레이션 직후 실제 값으로 갱신된다.
 */
const subscribe = () => () => {};

const getSnapshot = (): InstallPlatform =>
  resolveInstallPlatform(navigator.userAgent, {
    maxTouchPoints: navigator.maxTouchPoints,
  });

const getServerSnapshot = (): InstallPlatform => "other";

export function useInstallPlatform(): InstallPlatform {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
