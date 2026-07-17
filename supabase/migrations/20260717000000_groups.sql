-- 방(groups)·그룹 멤버(group_members) 테이블과 방 생성 트랜잭션 RPC.
--
-- 방은 모든 데이터 격리의 경계다(conventions.md §3). 서버는 service_role 로
-- 접속해 RLS 를 우회하고, 방 단위 격리는 애플리케이션 인가 계층이 강제한다.
-- 그래도 도메인 규칙(모든 테이블 RLS 활성화)에 따라 RLS 를 켜 둔다 — 정책을
-- 두지 않으므로 anon/authenticated 로는 접근 불가, service_role 만 통과한다.
--
-- created_by / user_id 의 profiles FK 는 profiles 테이블(auth 영역)이 생기면
-- 별도 마이그레이션에서 추가한다. 지금은 uuid 로만 둔다.

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,
  created_by  uuid not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- 사람이 공유하기 쉬운 6자 초대 코드(대문자+숫자). 확장 의존 없이 생성한다.
create or replace function public.gen_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    ),
    ''
  )
  from generate_series(1, 6);
$$;

-- 방 생성 + 개설자 owner 등록을 한 트랜잭션(함수)으로 원자 실행한다.
-- 초대 코드는 유니크 충돌 시 재생성한다.
create or replace function public.create_group_with_owner(
  p_user_id uuid,
  p_name    text
)
returns table (
  id           uuid,
  name         text,
  invite_code  text,
  role         text,
  member_count bigint,
  created_at   timestamptz
)
language plpgsql
as $$
declare
  v_group_id    uuid;
  v_invite_code text;
  v_created_at  timestamptz;
begin
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'name is required' using errcode = '22023';
  end if;

  loop
    v_invite_code := public.gen_invite_code();
    exit when not exists (
      select 1 from public.groups g where g.invite_code = v_invite_code
    );
  end loop;

  insert into public.groups (name, invite_code, created_by)
  values (btrim(p_name), v_invite_code, p_user_id)
  returning groups.id, groups.created_at into v_group_id, v_created_at;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, p_user_id, 'owner');

  return query
  select
    v_group_id,
    btrim(p_name),
    v_invite_code,
    'owner'::text,
    1::bigint,
    v_created_at;
end;
$$;

-- 신규 엔티티 자동 노출이 꺼진 프로젝트를 위해 service_role 에 명시적으로 부여한다.
grant execute on function public.create_group_with_owner(uuid, text) to service_role;
