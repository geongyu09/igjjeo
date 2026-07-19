/**
 * 주간 결산·그룹·잠금화면 목 데이터.
 */

import type { MockDigest, MockGroup, MockLockScreen } from "./types";

/** 주간 결산 (08) — 일요일 저녁 자동 발행 */
export const MOCK_DIGEST: MockDigest = {
  weekLabel: "7월 2주차 · 3조 뉴스룸",
  roomLabel: "이번 주 결산",
  personOfWeek: { name: "김*규", note: "기사 6건에 등장 · 최다 화제" },
  scoopOfWeek: {
    headline: "상습 지각, 이대로 괜찮은가",
    meta: "반응 27개 · 데일리쇼크",
  },
  reporterOfWeek: { name: "이*아", note: "제보 9건" },
};

/** 그룹 생성 (10) */
export const MOCK_GROUP: MockGroup = {
  name: "3조 뉴스룸",
  inviteCode: "7K2Q",
  members: [
    { label: "나", role: "방장" },
    { label: "초대 대기 중…", pending: true },
  ],
};

/** 속보 잠금화면 (09) — 자극적 언론사 기사만, 하루 1~2건 */
export const MOCK_LOCKSCREEN: MockLockScreen = {
  dateLabel: "7월 15일 화요일",
  timeLabel: "9:41",
  notifications: [
    {
      outlet: "shock",
      headline: "【속보】 상습 지각, 이대로 괜찮은가",
      meta: "데일리쇼크 · 벌써 12명이 봤어요",
      timeAgo: "지금",
    },
    {
      outlet: "shock",
      headline: '【충격】 "안 왔다"는 주장마저 거짓이었나',
      meta: "데일리쇼크 · 정정보도 3보",
      timeAgo: "3시간 전",
    },
  ],
};
