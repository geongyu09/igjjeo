/**
 * 목(mock) 데이터 타입 — 프로토타입 UI용.
 * outlet_key(OutletKey)·reaction_type(ReactionType)은 실제 DB 스키마와 공유하는 식별자를
 * 그대로 사용해, 이후 Supabase 데이터 계층으로 교체할 때 타입만 맞추면 되도록 한다.
 */

import type { OutletKey } from "@/lib/publishers";
import type { ReactionType } from "@/lib/reactions";

export interface MockArticle {
  id: string;
  /** 같은 제보에서 나온 기사끼리 묶는 키 (피드 정렬용) */
  reportId: string;
  outlet: OutletKey;
  headline: string;
  /** 피드/미리보기 발췌 */
  excerpt: string;
  /** 상세 본문 */
  body: string;
  imageUrl?: string;
  /** 상세 상단 모노 메타 ("특종 기자 · 오전 10:24 · 제보 김*규") */
  byline: string;
  /** 제보자 마스킹 이름 ("김*규") */
  reporterLabel: string;
  /** 상대 시각 라벨 ("방금", "2시간") */
  timeLabel: string;
  viewCount: number;
  commentCount: number;
  reactions: Record<ReactionType, number>;
}

export interface MockComment {
  id: string;
  /** 작성자 마스킹 이름 ("이*아") */
  authorLabel: string;
  timeLabel: string;
  body: string;
}

export interface MockProfile {
  name: string;
  badge?: string;
  stats: { reports: number; reactions: number; scoops: number };
  subscribed: OutletKey[];
  myReports: { outlet: OutletKey; headline: string; viewCount: number }[];
}

export interface MockDigest {
  weekLabel: string;
  roomLabel: string;
  personOfWeek: { name: string; note: string };
  scoopOfWeek: { headline: string; meta: string };
  reporterOfWeek: { name: string; note: string };
}

export interface MockGroup {
  name: string;
  inviteCode: string;
  members: { label: string; role?: string; pending?: boolean }[];
}

export interface MockLockNotification {
  outlet: OutletKey;
  headline: string;
  meta: string;
  timeAgo: string;
}

export interface MockLockScreen {
  dateLabel: string;
  timeLabel: string;
  notifications: MockLockNotification[];
}
