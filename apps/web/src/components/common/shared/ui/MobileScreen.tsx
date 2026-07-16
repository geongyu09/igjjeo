import type { ReactNode } from "react";
import styles from "./MobileScreen.module.css";

export interface MobileScreenProps {
  /** 상단 고정 영역 (ScreenHeader 등) */
  header?: ReactNode;
  /** 하단 고정 영역 (BottomTabBar·CTA 등) */
  footer?: ReactNode;
  /** 스크롤되는 본문 */
  children: ReactNode;
  /** 다크 풀블리드 (잠금화면 등) */
  tone?: "default" | "dark";
  className?: string;
}

/**
 * 모바일 화면 셸 — 뷰포트를 꽉 채우고, 넓은 화면에선 디바이스 프레임처럼 보인다.
 * header/footer는 고정, children은 그 사이에서 스크롤된다.
 */
export function MobileScreen({
  header,
  footer,
  children,
  tone = "default",
  className,
}: MobileScreenProps) {
  return (
    <div
      className={[styles.screen, className].filter(Boolean).join(" ")}
      data-tone={tone}
    >
      {header && <div className={styles.slot}>{header}</div>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.slot}>{footer}</div>}
    </div>
  );
}
