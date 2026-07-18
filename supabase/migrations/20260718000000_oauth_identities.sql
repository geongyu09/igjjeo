-- OAuth 신원(oauth_identities)과 프로필 온보딩 플래그(profiles.onboarded).
--
-- 소셜 로그인(Google·Apple)은 네이티브가 provider id_token 을 받아 서버에 넘기고,
-- 서버가 (provider, subject) 로 프로필을 find-or-create 한다. 비밀번호 자격(auth_credentials)
-- 과 분리해 소셜 신원만 이 테이블에 둔다. 서버는 service_role 로만 접근하고 RLS 는 정책 없이 켠다.

-- 온보딩(이름 등 기본 정보 입력) 완료 여부. 이메일 회원가입은 가입 시 이름을 받으므로 true.
-- OAuth 신규 가입만 false 로 시작해, 웹 온보딩 화면에서 이름을 저장하면 true 로 바뀐다.
alter table public.profiles
  add column if not exists onboarded boolean not null default true;

create table if not exists public.oauth_identities (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  provider   text not null,
  subject    text not null,
  email      text,
  created_at timestamptz not null default now(),
  unique (provider, subject)
);

create index if not exists oauth_identities_profile_id_idx
  on public.oauth_identities (profile_id);

alter table public.oauth_identities enable row level security;

-- OAuth 신규 가입: 프로필(onboarded=false) + oauth_identities 를 한 트랜잭션으로 원자 생성한다.
-- (provider, subject) 중복이면 oauth_identities unique 위반(23505)이 그대로 전파된다.
create or replace function public.create_oauth_account(
  p_provider     text,
  p_subject      text,
  p_email        text,
  p_display_name text,
  p_masked_name  text
)
returns table (
  id           uuid,
  display_name text,
  masked_name  text,
  avatar_url   text,
  onboarded    boolean,
  created_at   timestamptz
)
language plpgsql
as $$
declare
  v_id      uuid;
  v_created timestamptz;
begin
  insert into public.profiles (display_name, masked_name, onboarded)
  values (p_display_name, p_masked_name, false)
  returning profiles.id, profiles.created_at into v_id, v_created;

  insert into public.oauth_identities (profile_id, provider, subject, email)
  values (v_id, p_provider, p_subject, p_email);

  return query
  select v_id, p_display_name, p_masked_name, null::text, false, v_created;
end;
$$;

grant execute on function public.create_oauth_account(text, text, text, text, text) to service_role;

-- 이메일 회원가입 RPC도 새 onboarded 컬럼을 반환하도록 갱신한다(가입 시 이름을 받으므로 true).
-- RETURNS TABLE 컬럼이 바뀌면 반환 타입 변경이라 create or replace 로는 안 되고, 먼저 drop 해야 한다.
drop function if exists public.create_account(text, text, text, text);
create function public.create_account(
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
  onboarded    boolean,
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
  select v_id, p_display_name, p_masked_name, null::text, true, v_created;
end;
$$;

grant execute on function public.create_account(text, text, text, text) to service_role;
