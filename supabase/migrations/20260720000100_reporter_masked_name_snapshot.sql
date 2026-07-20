-- 제보자 닉네임을 "제보 시점" 값으로 고정한다.
--
-- 그동안 피드/상세는 제보자 표시명을 reports.reporter_id → profiles.masked_name 로
-- 조회할 때마다 라이브 조인했다. 그래서 사용자가 닉네임(display_name)을 바꾸면
-- masked_name 도 재파생되어(profiles.service.updateMe) 과거 기사의 제보자 표시까지 함께
-- 바뀌었다. 제보 당시의 이름으로 기억되도록, 제보 시점 masked_name 을 reports 에 스냅샷한다.

-- 1) 스냅샷 컬럼. 제보가 만들어질 때의 제보자 마스킹 이름을 그대로 보존한다.
alter table public.reports
  add column if not exists reporter_masked_name text;

-- 2) 기존 제보 백필 — 지난 값은 알 수 없으므로 현재 masked_name 으로 채운다.
update public.reports r
set reporter_masked_name = p.masked_name
from public.profiles p
where p.id = r.reporter_id
  and r.reporter_masked_name is null;

alter table public.reports
  alter column reporter_masked_name set not null;

-- 3) INSERT 시 제보자의 현재 masked_name 을 자동 스냅샷한다. 일반 제보(createReport)와
--    제3자 정정(publish_third_party_correction) 등 모든 reports INSERT 경로를 한 곳에서
--    덮는다. 명시적으로 값이 들어오면(백필/이관 등) 그 값을 존중한다.
create or replace function public.reports_snapshot_reporter_masked_name()
returns trigger
language plpgsql
as $$
begin
  if new.reporter_masked_name is null then
    select p.masked_name
    into new.reporter_masked_name
    from public.profiles p
    where p.id = new.reporter_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_snapshot_reporter_masked_name on public.reports;
create trigger reports_snapshot_reporter_masked_name
  before insert on public.reports
  for each row
  execute function public.reports_snapshot_reporter_masked_name();

-- 4) 읽기 경로: profiles 라이브 조인 대신 제보 시점 스냅샷을 읽는다.

-- 방 피드
create or replace function public.list_group_feed(
  p_group_id uuid,
  p_user_id  uuid,
  p_limit    int,
  p_before   timestamptz
)
returns table (
  report_id uuid,
  bundle_at timestamptz,
  bundle    jsonb
)
language sql
stable
as $$
  with bundles as (
    select a.report_id, max(a.published_at) as bundle_at
    from public.articles a
    where a.group_id = p_group_id and a.is_active = true
    group by a.report_id
  ),
  paged as (
    select b.report_id, b.bundle_at
    from bundles b
    where p_before is null or b.bundle_at < p_before
    order by b.bundle_at desc
    limit p_limit
  )
  select
    pg.report_id,
    pg.bundle_at,
    jsonb_build_object(
      'report_id', pg.report_id,
      'reporter', (
        select jsonb_build_object('masked_name', r.reporter_masked_name)
        from public.reports r
        where r.id = pg.report_id
      ),
      'articles', coalesce((
        select jsonb_agg(public.article_card(a, p_user_id) order by a.published_at asc, a.created_at asc)
        from public.articles a
        where a.report_id = pg.report_id and a.is_active = true
      ), '[]'::jsonb)
    ) as bundle
  from paged pg
  order by pg.bundle_at desc;
$$;

-- 기사 상세 (20260720000000_article_is_mine.sql 의 최신 정의를 스냅샷 참조로만 교체)
create or replace function public.get_article_detail(
  p_article_id uuid,
  p_user_id    uuid
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', a.id,
    'report_id', a.report_id,
    'group_id', a.group_id,
    'outlet_key', a.outlet_key,
    'headline', a.headline,
    'body', a.body,
    'reporter_name', a.reporter_name,
    'reporter', (
      select jsonb_build_object('masked_name', r.reporter_masked_name)
      from public.reports r
      where r.id = a.report_id
    ),
    -- 정정 기사는 원 기사와 report_id 를 공유한다 — 제보자를 소유자로 보면 반박당한 쪽이
    -- 남의 반박을 내릴 수 있게 되므로, 정정 기사는 누구의 것도 아니다(내릴 수 없다).
    'is_mine', coalesce((
      select r.reporter_id = p_user_id and a.is_correction = false
      from public.reports r
      where r.id = a.report_id
    ), false),
    'published_at', a.published_at,
    'is_correction', a.is_correction,
    'corrects_article_id', a.corrects_article_id,
    'is_active', a.is_active,
    'reaction_counts', public.reaction_counts(a.id),
    'my_reactions', public.my_reactions(a.id, p_user_id),
    'comment_count', (select count(*) from public.comments c where c.article_id = a.id),
    'correction_chain', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', cc.id, 'is_correction', cc.is_correction, 'headline', cc.headline)
        order by cc.published_at asc
      )
      from public.article_correction_chain(a.id) cc
    ), '[]'::jsonb)
  )
  from public.articles a
  where a.id = p_article_id and a.is_active = true;
$$;

grant execute on function public.list_group_feed(uuid, uuid, int, timestamptz) to service_role;
grant execute on function public.get_article_detail(uuid, uuid) to service_role;
