"use client";

import { Bell, CalendarCheck, Newspaper, Plus, Search, User, type LucideIcon } from "lucide-react";
import { useStackLinkRouter } from "stack-link";
import styles from "./BottomTabBar.module.css";

export type BottomTab = "feed" | "search" | "notifications" | "digest" | "profile";

interface TabDef {
  key: BottomTab;
  label: string;
  icon: LucideIcon;
  /** 대응 라우트가 없는 탭(검색·알림)은 href 없음 → 비활성(placeholder) */
  href?: string;
}

export interface BottomTabBarProps {
  active: BottomTab;
  /** 4번째 슬롯을 알림 대신 결산으로 (08 결산 화면) */
  showDigest?: boolean;
  className?: string;
}

const FEED: TabDef = { key: "feed", label: "피드", icon: Newspaper, href: "/" };
const SEARCH: TabDef = { key: "search", label: "검색", icon: Search };
const NOTIFICATIONS: TabDef = { key: "notifications", label: "알림", icon: Bell };
const DIGEST: TabDef = { key: "digest", label: "결산", icon: CalendarCheck, href: "/digest" };
const PROFILE: TabDef = { key: "profile", label: "프로필", icon: User, href: "/profile" };

/**
 * 하단 탭 바. webview-architecture 규칙상 원래는 네이티브가 그리지만,
 * 브리지·네이티브 셸 연동 전이라 웹 프로토타입에서 웹으로 렌더한다.
 * 화면 전환은 stack-link(useStackLinkRouter) 경유.
 */
export function BottomTabBar({ active, showDigest = false, className }: BottomTabBarProps) {
  const { navigate } = useStackLinkRouter({});
  const left = [FEED, SEARCH];
  const right = [showDigest ? DIGEST : NOTIFICATIONS, PROFILE];

  const renderTab = (tab: TabDef) => {
    const Icon = tab.icon;
    const isActive = tab.key === active;
    const inert = !tab.href;
    return (
      <button
        key={tab.key}
        type="button"
        className={styles.tab}
        data-active={isActive ? "" : undefined}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={inert ? true : undefined}
        onClick={inert ? undefined : () => navigate({ href: tab.href!, animation: "none" })}
      >
        <Icon size={22} aria-hidden />
        <span className={styles.label}>{tab.label}</span>
      </button>
    );
  };

  return (
    <nav className={[styles.tabBar, className].filter(Boolean).join(" ")} aria-label="주요 메뉴">
      {left.map(renderTab)}
      <div className={styles.fabSlot}>
        <button
          type="button"
          className={styles.fab}
          aria-label="제보하기"
          onClick={() => navigate({ href: "/report", animation: "slide" })}
        >
          <Plus size={15} aria-hidden />
          제보
        </button>
      </div>
      {right.map(renderTab)}
    </nav>
  );
}
