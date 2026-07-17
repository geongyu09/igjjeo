-- 데일리 프롬프트·첫 사용 경험. 피드가 비었을 때 서비스가 먼저 질문을 던져 대화를
-- 부트스트랩한다(daily-prompts.md). 답변을 모아 하나의 제보로 전환·각색·발행한다.
--
-- 답변 저장은 권장안(확장 테이블 daily_prompt_answers) 기준. 프롬프트는 방·날짜당 1건.
-- 발행 여부는 published_report_id 로 추적해 중복 발행을 409 로 막는다.

create table if not exists public.daily_prompts (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid not null references public.groups (id) on delete cascade,
  question           text not null,
  date               date not null,
  published_report_id uuid references public.reports (id) on delete set null,
  created_at         timestamptz not null default now(),
  unique (group_id, date)
);

create table if not exists public.daily_prompt_answers (
  id          uuid primary key default gen_random_uuid(),
  prompt_id   uuid not null references public.daily_prompts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  answer_text text not null,
  created_at  timestamptz not null default now(),
  unique (prompt_id, user_id)
);

alter table public.daily_prompts enable row level security;
alter table public.daily_prompt_answers enable row level security;

-- 오늘(지정일)의 프롬프트 + 내 답변 여부. 없으면 null → 서비스가 204.
create or replace function public.get_daily_prompt(
  p_group_id uuid,
  p_date     date,
  p_user_id  uuid
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', dp.id,
    'question', dp.question,
    'date', dp.date,
    'answer_count', (
      select count(*) from public.daily_prompt_answers a where a.prompt_id = dp.id
    ),
    'answered_by_me', exists (
      select 1 from public.daily_prompt_answers a
      where a.prompt_id = dp.id and a.user_id = p_user_id
    ),
    'published_report_id', dp.published_report_id
  )
  from public.daily_prompts dp
  where dp.group_id = p_group_id and dp.date = p_date;
$$;

-- 프롬프트 답변(사용자당 1건, 재제출은 갱신). 갱신된 답변 수·내 답변 여부 반환.
create or replace function public.upsert_prompt_answer(
  p_prompt_id   uuid,
  p_user_id     uuid,
  p_answer_text text
)
returns jsonb
language plpgsql
as $$
begin
  insert into public.daily_prompt_answers (prompt_id, user_id, answer_text)
  values (p_prompt_id, p_user_id, p_answer_text)
  on conflict (prompt_id, user_id)
  do update set answer_text = excluded.answer_text, created_at = now();

  return jsonb_build_object(
    'prompt_id', p_prompt_id,
    'answer_count', (
      select count(*) from public.daily_prompt_answers a where a.prompt_id = p_prompt_id
    ),
    'answered_by_me', true
  );
end;
$$;

-- 모인 답변을 제보로 전환 → 발행. 이미 발행된 프롬프트면 예외(앱이 409 로 변환).
-- p_articles = [{ outlet_key, headline, body, reporter_name }, ...].
create or replace function public.publish_daily_prompt(
  p_prompt_id   uuid,
  p_group_id    uuid,
  p_reporter_id uuid,
  p_raw_text    text,
  p_articles    jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_prompt    public.daily_prompts%rowtype;
  v_report_id uuid;
  v_draft     jsonb;
begin
  select * into v_prompt from public.daily_prompts where id = p_prompt_id for update;
  if not found then
    raise exception 'prompt not found' using errcode = 'no_data_found';
  end if;
  if v_prompt.published_report_id is not null then
    raise exception 'prompt already published' using errcode = 'raise_exception';
  end if;

  insert into public.reports (group_id, reporter_id, raw_text, status)
  values (p_group_id, p_reporter_id, p_raw_text, 'published')
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

  update public.daily_prompts set published_report_id = v_report_id where id = p_prompt_id;

  return jsonb_build_object(
    'report_id', v_report_id,
    'articles', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.published_at asc, a.created_at asc)
      from public.articles a
      where a.report_id = v_report_id
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_daily_prompt(uuid, date, uuid) to service_role;
grant execute on function public.upsert_prompt_answer(uuid, uuid, text) to service_role;
grant execute on function public.publish_daily_prompt(uuid, uuid, uuid, text, jsonb) to service_role;
