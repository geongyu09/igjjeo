"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

/** 이 거리(px) 이상 당겼다 놓으면 새로고침이 실행된다. */
const PULL_THRESHOLD = 64;
/** 당김 거리의 상한 — 고무줄처럼 더 늘어나지 않는다. */
const MAX_PULL = 96;
/** 손가락 이동량 대비 실제로 따라오는 비율 (저항감). */
const PULL_RESISTANCE = 0.5;
/** 새로고침이 도는 동안 인디케이터를 붙잡아 두는 높이. */
const REFRESHING_OFFSET = 56;

export interface UsePullToRefreshProps {
  /** 스크롤 컨테이너 — 이 요소가 최상단일 때만 제스처가 시작된다. */
  containerRef: RefObject<HTMLElement | null>;
  /** 새로고침 동작. 없으면 제스처가 비활성화된다. */
  onRefresh?: () => void | Promise<void>;
}

export interface UsePullToRefreshResult {
  /** 현재 당겨진 거리(px). 인디케이터 위치·회전에 쓴다. */
  pullDistance: number;
  /** onRefresh가 끝나기를 기다리는 중인지. */
  isRefreshing: boolean;
}

/**
 * 스크롤 최상단에서 아래로 당기면 새로고침하는 제스처 (pull to refresh).
 *
 * 터치 리스너를 `{ passive: false }`로 직접 등록한다 — 당기는 동안 브라우저/WebView의
 * 기본 오버스크롤(바운스)을 preventDefault로 막아야 인디케이터만 따라오기 때문이다.
 * (React의 onTouchMove는 passive라 preventDefault가 무시된다.)
 */
export function usePullToRefresh({
  containerRef,
  onRefresh,
}: UsePullToRefreshProps): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 제스처 진행 중 값은 리렌더를 유발하면 안 되므로 ref에 둔다.
  const startYRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const setDistance = useCallback((next: number) => {
    distanceRef.current = next;
    setPullDistance(next);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onRefresh) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (container.scrollTop > 0) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const startY = startYRef.current;
      if (startY === null) return;

      const currentY = event.touches[0]?.clientY;
      if (currentY === undefined) return;

      const delta = currentY - startY;
      if (delta <= 0) {
        // 위로 스와이프하면 평범한 스크롤로 돌려준다.
        if (distanceRef.current !== 0) setDistance(0);
        startYRef.current = null;
        return;
      }

      event.preventDefault();
      setDistance(Math.min(delta * PULL_RESISTANCE, MAX_PULL));
    };

    const handleTouchEnd = () => {
      const distance = distanceRef.current;
      startYRef.current = null;

      if (distance < PULL_THRESHOLD) {
        setDistance(0);
        return;
      }

      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setDistance(REFRESHING_OFFSET);

      void Promise.resolve(onRefresh()).finally(() => {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
        setDistance(0);
      });
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [containerRef, onRefresh, setDistance]);

  return { pullDistance, isRefreshing };
}

export const PULL_TO_REFRESH_THRESHOLD = PULL_THRESHOLD;
