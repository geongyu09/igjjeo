-- 정정 연쇄를 "최초 기사부터" 돌려주도록 바꾼다.
--
-- 종전 article_correction_chain 은 인자로 받은 기사에서 아래로만(하향) 훑고
-- 자기 자신도 제외했다. 그래서 정정 기사에서 연쇄를 열면 그 위쪽(원본·앞선 정정)이
-- 통째로 사라져, 사건의 시작을 볼 수 없었다.
-- 이제 먼저 위로 거슬러 올라가 최초 기사를 찾고, 거기서부터 전체를 내려받는다.
-- 어느 기사에서 열든 같은 한 줄기가 나온다.

-- 정정 관계의 부모 기사. 연결 축이 둘이라 한 곳으로 모은다.
-- - 당사자 정정: articles.corrects_article_id → 원 기사
-- - 제3자 정정: reports.parent_article_id → 원 기사 (기사 자체는 corrects 포인터가 없다)
create or replace function public.article_parent_id(p_article_id uuid)
returns uuid
language sql
stable
as $$
  select coalesce(
    a.corrects_article_id,
    (select r.parent_article_id from public.reports r where r.id = a.report_id)
  )
  from public.articles a
  where a.id = p_article_id;
$$;

-- 연쇄의 최초 기사(루트). 부모가 없어질 때까지 상향으로 거슬러 오른다.
-- 비활성 기사도 타고 넘는다 — 중간이 내려갔다고 사건의 시작이 끊기면 안 된다.
-- depth 상한은 데이터 이상으로 사이클이 생겼을 때의 안전장치다.
create or replace function public.article_correction_root(p_article_id uuid)
returns uuid
language sql
stable
as $$
  with recursive up as (
    select p_article_id as id, 0 as depth
    union all
    select public.article_parent_id(up.id), up.depth + 1
    from up
    where public.article_parent_id(up.id) is not null
      and up.depth < 50
  )
  select id from up order by depth desc limit 1;
$$;

-- 정정 연쇄 전체(최초 기사 → 최신 정정, 시간순). 인자로 받은 기사도 포함한다.
-- 하향 재귀는 종전과 같은 두 축(corrects_article_id · reports.parent_article_id)을 탄다.
create or replace function public.article_correction_chain(p_article_id uuid)
returns setof public.articles
language sql
stable
as $$
  with recursive chain as (
    select a.*
    from public.articles a
    where a.id = public.article_correction_root(p_article_id)
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
  where is_active = true
  order by published_at asc;
$$;

grant execute on function public.article_parent_id(uuid) to service_role;
grant execute on function public.article_correction_root(uuid) to service_role;
grant execute on function public.article_correction_chain(uuid) to service_role;
