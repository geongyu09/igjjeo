-- 언론사 구독 기능 제거 — 구독 화면(06)과 프로필의 "구독 중 · 공개" 섹션을 걷어내면서
-- 유일한 저장소였던 profiles.subscribed_outlets 컬럼도 함께 내린다.
--
-- 이 컬럼은 20260718000100_profile_summary.sql 이 추가했으나, 갱신 경로(PATCH /v1/me DTO)가
-- 끝내 붙지 않아 읽기 전용 빈 배열로만 남아 있었다. 구독은 scope.md 기준 이번 범위 밖(v2)이다.
-- 되살릴 땐 컬럼·API 응답(ProfileResponse)·화면을 함께 복구할 것.

alter table public.profiles
  drop column if exists subscribed_outlets;
