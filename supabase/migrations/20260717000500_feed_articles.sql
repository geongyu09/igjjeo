-- 피드·기사 상세 조회. 반응 집계·댓글 수·제보자 마스킹 이름을 함께 내려
-- 화면이 추가 요청 없이 카드를 그리게 한다(feed-articles.md).
--
-- 핵심 규칙: 같은 제보(report_id)에서 나온 기사들은 한 묶음으로 붙어 있어야 하고,
-- 묶음 단위 최신 발행순으로 정렬한다. 커서도 묶음 경계(묶음의 최신 published_at)로 자른다.
-- 반응/댓글 집계 헤퍼는 20260717000400 에 정의되어 있어 여기서 재사용한다.

-- 기사 한 건을 카드 JSON 으로 직렬화(피드·상세 공용 조각).
create or replace function public.article_card(p_article public.articles, p_user_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', p_article.id,
    'outlet_key', p_article.outlet_key,
    'headline', p_article.headline,
    'excerpt', left(p_article.body, 140),
    'reporter_name', p_article.reporter_name,
    'published_at', p_article.published_at,
    'is_correction', p_article.is_correction,
    'corrects_article_id', p_article.corrects_article_id,
    'reaction_counts', public.reaction_counts(p_article.id),
    'my_reactions', public.my_reactions(p_article.id, p_user_id),
    'comment_count', (select count(*) from public.comments c where c.article_id = p_article.id)
  );
$$;

-- 방 피드: 제보 묶음 배열. 묶음의 대표 시각(bundle_at) = 그 묶음 최신 published_at.
-- 커서(p_before)는 bundle_at 기준. 활성(is_active) 기사만.
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
        select jsonb_build_object('masked_name', pr.masked_name)
        from public.reports r
        join public.profiles pr on pr.id = r.reporter_id
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

-- 정정 연쇄(하향): 이 기사를 정정하거나(corrects_article_id) 이 기사를 원본으로 하는
-- 제3자 정정 제보(reports.parent_article_id)에서 나온 기사들을 재귀로 모은다.
create or replace function public.article_correction_chain(p_article_id uuid)
returns setof public.articles
language sql
stable
as $$
  with recursive chain as (
    select a.* from public.articles a where a.id = p_article_id
    union
    select a.*
    from public.articles a
    join chain c on (
      a.corrects_article_id = c.id
      or a.report_id in (
        select r.id from public.reports r where r.parent_article_id = c.id
      )
    )
  )
  select * from chain
  where id <> p_article_id and is_active = true
  order by published_at asc;
$$;

-- 기사 상세(활성 기사만). 없거나 비활성이면 null → 서비스가 404 로 숨긴다.
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
      select jsonb_build_object('masked_name', pr.masked_name)
      from public.reports r
      join public.profiles pr on pr.id = r.reporter_id
      where r.id = a.report_id
    ),
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

grant execute on function public.article_card(public.articles, uuid) to service_role;
grant execute on function public.list_group_feed(uuid, uuid, int, timestamptz) to service_role;
grant execute on function public.article_correction_chain(uuid) to service_role;
grant execute on function public.get_article_detail(uuid, uuid) to service_role;
