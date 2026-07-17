-- 프로필(profiles)과 인증 저장소(auth_credentials·refresh_tokens).
--
-- 자체 인증(Supabase Auth 대체). 인증 크리덴셜(비밀번호 해시·리프레시 토큰)은
-- profiles 와 분리된 테이블에 둔다 — 실명·해시가 방 데이터와 섞이지 않게
-- (auth-profile.md). 서버는 service_role 로만 접근하고, RLS 는 정책 없이 켜 둔다.

create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  masked_name  text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- 이메일+비밀번호 자격. email 은 앱에서 소문자 정규화해 저장하므로 단순 unique 로 충분.
create table if not exists public.auth_credentials (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null unique references public.profiles (id) on delete cascade,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- 리프레시 토큰(회전식). 원문은 저장하지 않고 sha256 해시만 보관한다.
create table if not exists public.refresh_tokens (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists refresh_tokens_profile_id_idx
  on public.refresh_tokens (profile_id);

alter table public.profiles enable row level security;
alter table public.auth_credentials enable row level security;
alter table public.refresh_tokens enable row level security;

-- groups 마이그레이션에서 미뤄 둔 profiles FK 를 이제 채운다.
alter table public.groups
  add constraint groups_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete cascade;

alter table public.group_members
  add constraint group_members_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- 회원가입: 프로필 + 크리덴셜 생성을 한 트랜잭션으로 원자 실행한다.
-- 이메일 중복이면 auth_credentials.email unique 위반(23505)이 그대로 전파된다.
create or replace function public.create_account(
  p_email         text,
  p_password_hash text,
  p_display_name  text,
  p_masked_name   text
)
returns table (
  id           uuid,
  display_name text,
  masked_name  text,
  avatar_url   text,
  created_at   timestamptz
)
language plpgsql
as $$
declare
  v_id      uuid;
  v_created timestamptz;
begin
  insert into public.profiles (display_name, masked_name)
  values (p_display_name, p_masked_name)
  returning profiles.id, profiles.created_at into v_id, v_created;

  insert into public.auth_credentials (profile_id, email, password_hash)
  values (v_id, p_email, p_password_hash);

  return query
  select v_id, p_display_name, p_masked_name, null::text, v_created;
end;
$$;

grant execute on function public.create_account(text, text, text, text) to service_role;
