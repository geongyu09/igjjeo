"use client";

import { RefreshCw } from "lucide-react";
import { useRef, type ReactNode } from "react";
import {
  PULL_TO_REFRESH_THRESHOLD,
  usePullToRefresh,
} from "@/hooks/common/usePullToRefresh";
import styles from "./MobileScreen.module.css";

export interface MobileScreenProps {
  /** 상단 고정 영역 (ScreenHeader 등) */
  header?: ReactNode;
  /** header 슬롯에 붙일 클래스 (sticky 등 화면별 고정 스타일용) */
  headerClassName?: string;
  /** 하단 고정 영역 (CTA 등). 탭 바는 네이티브가 그린다. */
  footer?: ReactNode;
  /** 스크롤되는 본문 */
  children: ReactNode;
  /**
   * 본문 래퍼에 붙일 클래스. 본문을 화면 높이만큼 채워야 하는 화면(세로 중앙 정렬 등)에서
   * `min-height: 100%` + flex를 주는 용도.
   */
  bodyClassName?: string;
  /** 다크 풀블리드 (잠금화면 등) */
  tone?: "default" | "dark";
  /** 본문 최상단에서 아래로 당기면 실행할 새로고침. 주지 않으면 제스처가 비활성화된다. */
  onRefresh?: () => void | Promise<void>;
  className?: string;
}

/**
 * 모바일 화면 셸 — 뷰포트를 꽉 채우고, 넓은 화면에선 디바이스 프레임처럼 보인다.
 * header/footer는 고정, children은 그 사이에서 스크롤된다.
 */
export function MobileScreen({
  header,
  headerClassName,
  footer,
  children,
  bodyClassName,
  tone = "default",
  onRefresh,
  className,
}: MobileScreenProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const { pullDistance, isRefreshing } = usePullToRefresh({
    containerRef: bodyRef,
    onRefresh,
  });

  return (
    <div
      className={[styles.screen, className].filter(Boolean).join(" ")}
      data-tone={tone}
    >
      {header && (
        <div
          className={[styles.slot, headerClassName].filter(Boolean).join(" ")}
        >
          {header}
        </div>
      )}
      <div className={styles.body} ref={bodyRef}>
        {onRefresh && (
          <div
            className={styles.refreshIndicator}
            style={{ height: pullDistance }}
            data-ready={pullDistance >= PULL_TO_REFRESH_THRESHOLD}
            data-refreshing={isRefreshing}
            data-settling={isRefreshing || pullDistance === 0}
            aria-hidden={!isRefreshing}
            {...(isRefreshing
              ? { role: "status", "aria-label": "새로고침 중" }
              : {})}
          >
            <RefreshCw
              className={styles.refreshIcon}
              size={18}
              style={{ rotate: `${pullDistance * 3}deg` }}
            />
          </div>
        )}
        <div
          className={[styles.bodyContent, bodyClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </div>
      {footer && <div className={styles.slot}>{footer}</div>}
    </div>
  );
}
