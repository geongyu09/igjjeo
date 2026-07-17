-- 정정·삭제(모더레이션). 당사자 삭제(소프트), 당사자/제3자 정정과 정정 연쇄.
-- 규칙 원본은 ai-rules.md, HTTP 계약은 corrections-deletion.md.
--
-- 원 기사는 하드 삭제하지 않는다 — 삭제 요청은 is_active=false 로만 내린다.
-- 당사자 정정: 원 기사 유지 + 정정 기사 1건(corrects_article_id 연결).
-- 제3자 정정: 원 기사 유지 + 새 제보(parent_article_id 연결)에서 언론사 수만큼 기사.

create table if not exists public.deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references public.articles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table if not exists public.correction_requests (
  id              uuid primary key default gen_random_uuid(),
  article_id      uuid not null references public.articles (id) on delete cascade,
  requested_by    uuid not null references public.profiles (id) on delete cascade,
  is_subject      boolean not null,
  correction_text text not null,
  created_at      timestamptz not null default now()
);

alter table public.deletion_requests enable row level security;
alter table public.correction_requests enable row level security;

-- 삭제 요청(이유 불요, 즉시 처리): 요청 기록 + 원 기사 소프트 다운(트랜잭션).
create or replace function public.request_deletion(
  p_article_id   uuid,
  p_requested_by uuid
)
returns jsonb
language plpgsql
as $$
begin
  insert into public.deletion_requests (article_id, requested_by)
  values (p_article_id, p_requested_by);

  update public.articles
  set is_active = false
  where id = p_article_id;

  return jsonb_build_object('article_id', p_article_id, 'is_active', false);
end;
$$;

-- 당사자 정정: 정정 기사 1건을 원 기사와 같은 report 묶음에 얹는다(원 기사 유지).
create or replace function public.insert_subject_correction(
  p_report_id           uuid,
  p_group_id            uuid,
  p_outlet_key          text,
  p_headline            text,
  p_body                text,
  p_reporter_name       text,
  p_corrects_article_id uuid
)
returns setof public.articles
language sql
as $$
  insert into public.articles (
    report_id, group_id, outlet_key, headline, body, reporter_name,
    is_correction, corrects_article_id
  )
  values (
    p_report_id, p_group_id, p_outlet_key, p_headline, p_body, p_reporter_name,
    true, p_corrects_article_id
  )
  returning *;
$$;

-- 제3자 정정: 원 기사를 부모로 하는 새 제보(즉시 발행)를 만들고 언론사 수만큼 기사 발행.
-- p_articles = [{ outlet_key, headline, body, reporter_name }, ...].
create or replace function public.publish_third_party_correction(
  p_group_id          uuid,
  p_reporter_id       uuid,
  p_parent_article_id uuid,
  p_raw_text          text,
  p_articles          jsonb
)
returns setof public.articles
language plpgsql
as $$
declare
  v_report_id uuid;
  v_draft     jsonb;
begin
  insert into public.reports (group_id, reporter_id, raw_text, status, parent_article_id)
  values (p_group_id, p_reporter_id, p_raw_text, 'published', p_parent_article_id)
  returning id into v_report_id;

  for v_draft in select d from jsonb_array_elements(p_articles) as d
  loop
    insert into public.articles (report_id, group_id, outlet_key, headline, body, reporter_name)
    values (
      v_report_id,
      p_group_id,
      v_draft ->> 'outlet_key',
      v_draft ->> 'headline',
      v_draft ->> 'body',
      v_draft ->> 'reporter_name'
    );
  end loop;

  return query
  select * from public.articles a
  where a.report_id = v_report_id
  order by a.published_at asc, a.created_at asc;
end;
$$;

grant execute on function public.request_deletion(uuid, uuid) to service_role;
grant execute on function public.insert_subject_correction(uuid, uuid, text, text, text, text, uuid) to service_role;
grant execute on function public.publish_third_party_correction(uuid, uuid, uuid, text, jsonb) to service_role;
