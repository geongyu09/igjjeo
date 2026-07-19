-- 방(groups)에 뉴스 각색용 키워드(최대 100자)를 추가한다.
-- 방 생성 시 개설자가 입력한 키워드를, 이후 이 방의 모든 뉴스 각색 프롬프트에
-- 참고 맥락으로 넣는다(ai-rules.md — 방 단위 톤·소재 힌트).

alter table public.groups
  add column if not exists keyword text;

-- 100자 상한을 DB 에서도 강제한다(서버 DTO 검증과 이중 방어).
alter table public.groups
  drop constraint if exists groups_keyword_len;
alter table public.groups
  add constraint groups_keyword_len
  check (keyword is null or char_length(keyword) <= 100);

-- create_group_with_owner 에 p_keyword 를 추가한다.
-- 시그니처가 (uuid, text) → (uuid, text, text) 로 바뀌므로 옛 함수를 먼저 내린다.
drop function if exists public.create_group_with_owner(uuid, text);

create or replace function public.create_group_with_owner(
  p_user_id uuid,
  p_name    text,
  p_keyword text default null
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
  v_keyword     text := nullif(btrim(p_keyword), '');
begin
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'name is required' using errcode = '22023';
  end if;

  if v_keyword is not null and char_length(v_keyword) > 100 then
    raise exception 'keyword too long' using errcode = '22023';
  end if;

  loop
    v_invite_code := public.gen_invite_code();
    exit when not exists (
      select 1 from public.groups g where g.invite_code = v_invite_code
    );
  end loop;

  insert into public.groups (name, invite_code, created_by, keyword)
  values (btrim(p_name), v_invite_code, p_user_id, v_keyword)
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

grant execute on function public.create_group_with_owner(uuid, text, text) to service_role;
