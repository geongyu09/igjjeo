-- 프로필 화면(07)의 동적 데이터: 구독 언론사(공개 취향) + 방 내 내 활동 요약.
--
-- 구독은 별도 테이블 없이 profiles 에 배열 컬럼으로 최소 보관한다(공개되는 취향 표시용).
-- 통계·내 제보 목록은 reports·articles·reactions 조인이 필요하므로 방-스코프 RPC 한 곳으로
-- 봉인해 화면이 추가 요청 없이 카드를 그리게 한다(집계=RPC 컨벤션).

-- 구독 중인 언론사 키 목록(공개). 기본값 빈 배열 — 아직 아무것도 구독하지 않은 상태.
alter table public.profiles
  add column if not exists subscribed_outlets text[] not null default '{}';

-- 방 안에서의 내 프로필 요약: 통계(제보 수·받은 반응·특종) + 내가 낸 제보 목록.
--   - 제보(reports): 내가 이 방에 올린 published 제보 수.
--   - 받은 반응(reactions): 그 제보들의 활성 기사에 달린 반응 총합.
--   - 특종(scoops): 그중 reaction_type='scoop' 반응 수.
--   - 제보 목록: 제보별 대표 기사(최신 발행) 헤드라인·언론사 + 제보 총 반응 수(반응 많은 순).
create or replace function public.get_member_profile_summary(
  p_group_id uuid,
  p_user_id  uuid
)
returns jsonb
language sql
stable
as $$
  with my_reports as (
    select r.id
    from public.reports r
    where r.group_id = p_group_id
      and r.reporter_id = p_user_id
      and r.status = 'published'
  ),
  report_reactions as (
    select
      mr.id as report_id,
      count(rx.id) as reaction_count,
      count(rx.id) filter (where rx.reaction_type = 'scoop') as scoop_count
    from my_reports mr
    left join public.articles a
      on a.report_id = mr.id and a.is_active = true
    left join public.reactions rx
      on rx.article_id = a.id
    group by mr.id
  ),
  rep_article as (
    select distinct on (a.report_id)
      a.report_id,
      a.outlet_key,
      a.headline
    from public.articles a
    join my_reports mr on mr.id = a.report_id
    where a.is_active = true
    order by a.report_id, a.published_at desc, a.created_at desc
  )
  select jsonb_build_object(
    'stats', jsonb_build_object(
      'reports', (select count(*) from my_reports),
      'reactions', (select coalesce(sum(reaction_count), 0) from report_reactions),
      'scoops', (select coalesce(sum(scoop_count), 0) from report_reactions)
    ),
    'reports', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', rr.report_id,
          'outlet_key', ra.outlet_key,
          'headline', ra.headline,
          'reaction_count', rr.reaction_count
        )
        order by rr.reaction_count desc, ra.headline asc
      )
      from report_reactions rr
      join rep_article ra on ra.report_id = rr.report_id
    ), '[]'::jsonb)
  );
$$;
