-- 반응(reactions)과 댓글(comments). 기사 참여 상호작용.
--
-- 반응은 (article_id, user_id, reaction_type) 유니크로 멱등 토글을 보장한다
-- (PUT=누름/있으면 그대로, DELETE=취소/없어도 성공, reactions-comments.md).
-- 집계(reaction_counts/my_reactions)는 피드·상세·토글 응답이 공유하므로 함수로 봉인한다.

create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  article_id    uuid not null references public.articles (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('really', 'shock', 'admit', 'scoop')),
  created_at    timestamptz not null default now(),
  unique (article_id, user_id, reaction_type)
);

create index if not exists reactions_article_idx on public.reactions (article_id);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_article_created_idx
  on public.comments (article_id, created_at asc);

alter table public.reactions enable row level security;
alter table public.comments enable row level security;

-- 기사별 반응 타입 집계(4종, 없으면 0). 피드/상세/토글 응답 공용.
create or replace function public.reaction_counts(p_article_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'really', count(*) filter (where reaction_type = 'really'),
    'shock',  count(*) filter (where reaction_type = 'shock'),
    'admit',  count(*) filter (where reaction_type = 'admit'),
    'scoop',  count(*) filter (where reaction_type = 'scoop')
  )
  from public.reactions
  where article_id = p_article_id;
$$;

-- 요청자가 이 기사에 누른 반응 타입 목록(버튼 활성 표시용).
create or replace function public.my_reactions(p_article_id uuid, p_user_id uuid)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(reaction_type order by reaction_type), '[]'::jsonb)
  from public.reactions
  where article_id = p_article_id and user_id = p_user_id;
$$;

-- 토글(PUT/DELETE) 응답용: 갱신된 집계 + 내 반응을 한 번에.
create or replace function public.article_reaction_state(
  p_article_id uuid,
  p_user_id    uuid
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'article_id', p_article_id,
    'reaction_counts', public.reaction_counts(p_article_id),
    'my_reactions', public.my_reactions(p_article_id, p_user_id)
  );
$$;

-- 댓글 목록(작성자 masked_name 포함, created_at 오름차순 = 대화 흐름).
create or replace function public.list_article_comments(
  p_article_id uuid,
  p_limit      int,
  p_after      timestamptz
)
returns table (
  id          uuid,
  masked_name text,
  body        text,
  created_at  timestamptz
)
language sql
stable
as $$
  select c.id, p.masked_name, c.body, c.created_at
  from public.comments c
  join public.profiles p on p.id = c.user_id
  where c.article_id = p_article_id
    and (p_after is null or c.created_at > p_after)
  order by c.created_at asc
  limit p_limit;
$$;

-- 댓글 작성(작성자 masked_name 을 함께 돌려줘 응답을 완성한다).
create or replace function public.create_comment(
  p_article_id uuid,
  p_user_id    uuid,
  p_body       text
)
returns table (
  id          uuid,
  masked_name text,
  body        text,
  created_at  timestamptz
)
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.comments (article_id, user_id, body)
  values (p_article_id, p_user_id, p_body)
  returning public.comments.id into v_id;

  return query
  select c.id, p.masked_name, c.body, c.created_at
  from public.comments c
  join public.profiles p on p.id = c.user_id
  where c.id = v_id;
end;
$$;

grant execute on function public.reaction_counts(uuid) to service_role;
grant execute on function public.my_reactions(uuid, uuid) to service_role;
grant execute on function public.article_reaction_state(uuid, uuid) to service_role;
grant execute on function public.list_article_comments(uuid, int, timestamptz) to service_role;
grant execute on function public.create_comment(uuid, uuid, text) to service_role;
