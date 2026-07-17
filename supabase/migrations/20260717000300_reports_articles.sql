-- 제보(reports)와 각색 기사(articles). 제보 한 건이 언론사 수만큼의 기사를 낳는다.
--
-- 각색 결과(초안)는 발행 전까지 articles 에 넣지 않고 reports.draft_articles(jsonb) 에
-- 캐시한다 — 클라이언트가 본문을 되돌려 보내 마스킹·톤 검증을 우회하지 못하게,
-- 서버가 본문의 유일한 진실이 된다(reports-adaptation.md). 발행은 outlet_key 목록만 받아
-- 캐시 초안에서 승격한다.

create table if not exists public.reports (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid not null references public.groups (id) on delete cascade,
  reporter_id        uuid not null references public.profiles (id) on delete cascade,
  raw_text           text not null,
  photo_url          text,
  status             text not null default 'draft' check (status in ('draft', 'published')),
  parent_article_id  uuid,          -- 제3자 정정에서 생긴 제보일 때 원 기사(FK 는 아래에서 추가)
  draft_articles     jsonb,         -- 발행 전 각색 초안 캐시
  draft_generated_at timestamptz,
  created_at         timestamptz not null default now()
);

create table if not exists public.articles (
  id                  uuid primary key default gen_random_uuid(),
  report_id           uuid not null references public.reports (id) on delete cascade,
  group_id            uuid not null references public.groups (id) on delete cascade,
  outlet_key          text not null check (outlet_key in ('daily', 'shock', 'economy')),
  headline            text not null,
  body                text not null,
  reporter_name       text not null,
  published_at        timestamptz not null default now(),
  is_correction       boolean not null default false,
  corrects_article_id uuid references public.articles (id) on delete set null,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists articles_group_id_published_idx
  on public.articles (group_id, published_at desc);
create index if not exists reports_group_id_idx on public.reports (group_id);

-- reports.parent_article_id → articles (articles 생성 후 순환 FK 를 채운다).
alter table public.reports
  add constraint reports_parent_article_id_fkey
  foreign key (parent_article_id) references public.articles (id) on delete set null;

alter table public.reports enable row level security;
alter table public.articles enable row level security;

-- 선택한 초안(outlet_key)만 articles 로 승격 + 제보를 published 로 전환하는 트랜잭션 RPC.
-- 인가·상태·outlet 유효성은 애플리케이션이 사전 검증한다(여기선 원자적 승격만 수행).
create or replace function public.publish_report(
  p_report_id   uuid,
  p_outlet_keys text[]
)
returns setof public.articles
language plpgsql
as $$
declare
  v_report public.reports%rowtype;
  v_draft  jsonb;
begin
  select * into v_report from public.reports r
  where r.id = p_report_id
  for update;

  if not found then
    raise exception 'report not found' using errcode = 'no_data_found';
  end if;
  if v_report.status <> 'draft' then
    raise exception 'report already published' using errcode = 'raise_exception';
  end if;

  -- 선택된 outlet_key 순서대로 캐시 초안에서 기사로 승격한다.
  for v_draft in
    select d
    from jsonb_array_elements(coalesce(v_report.draft_articles, '[]'::jsonb)) as d
    where d ->> 'outlet_key' = any (p_outlet_keys)
  loop
    insert into public.articles (report_id, group_id, outlet_key, headline, body, reporter_name)
    values (
      v_report.id,
      v_report.group_id,
      v_draft ->> 'outlet_key',
      v_draft ->> 'headline',
      v_draft ->> 'body',
      v_draft ->> 'reporter_name'
    );
  end loop;

  update public.reports
  set status = 'published', draft_articles = null, draft_generated_at = null
  where id = p_report_id;

  return query
  select * from public.articles a
  where a.report_id = p_report_id
  order by a.published_at asc, a.created_at asc;
end;
$$;

grant execute on function public.publish_report(uuid, text[]) to service_role;
