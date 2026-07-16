import type { ReactNode } from "react";
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
  headerClassName,
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
      {header && (
        <div
          className={[styles.slot, headerClassName].filter(Boolean).join(" ")}
        >
          {header}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.slot}>{footer}</div>}
    </div>
  );
}
