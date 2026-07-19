-- 제보 한도 충전(report_quota_refills).
--
-- 하루 제보 한도는 별도 카운터 컬럼 없이 "KST 오늘 만든 제보 행 수"로 계산한다
-- (data-model.md "하루 제보 한도"). 그래서 한도를 되돌려 주는 방법은 카운트의 하한을
-- 뒤로 미는 것이다 — 충전 시각을 여기에 남기고, 카운트 하한을
-- max(KST 자정, 오늘의 최신 충전 시각) 으로 잡는다.
--
-- 지금은 버튼을 누르면 즉시 충전되지만, 이후 광고 시청 보상으로 바뀔 때
-- 이 테이블이 지급 이력(누가·언제 충전했는지)의 자리가 된다.

create table if not exists public.report_quota_refills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- "이 사용자의 오늘 최신 충전" 조회 전용 인덱스.
create index if not exists report_quota_refills_user_created_idx
  on public.report_quota_refills (user_id, created_at desc);

alter table public.report_quota_refills enable row level security;
