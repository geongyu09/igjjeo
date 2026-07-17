-- 방·멤버십 조회/참여/관리 연산. 집계(member_count)·유니크 재발급·멱등 참여처럼
-- 원자성/루프가 필요한 부분은 RPC 로, 단순 조회/삭제는 애플리케이션의 plain 쿼리로 둔다.

-- member_count 를 비정규화 없이 매 조회 계산하는 요약 뷰.
create or replace view public.group_summaries as
select
  g.id,
  g.name,
  g.invite_code,
  g.created_by,
  g.created_at,
  (select count(*) from public.group_members m where m.group_id = g.id) as member_count
from public.groups g;

grant select on public.group_summaries to service_role;

-- 내가 속한 방 목록(joined_at 역순 keyset 페이지네이션). p_before 가 null 이면 첫 페이지.
create or replace function public.list_my_groups(
  p_user_id uuid,
  p_limit   int,
  p_before  timestamptz default null
)
returns table (
  id           uuid,
  name         text,
  invite_code  text,
  role         text,
  member_count bigint,
  created_at   timestamptz,
  joined_at    timestamptz
)
language sql
stable
as $$
  select
    g.id,
    g.name,
    g.invite_code,
    gm.role,
    (select count(*) from public.group_members m where m.group_id = g.id) as member_count,
    g.created_at,
    gm.joined_at
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = p_user_id
    and (p_before is null or gm.joined_at < p_before)
  order by gm.joined_at desc
  limit greatest(1, least(p_limit, 50));
$$;

grant execute on function public.list_my_groups(uuid, int, timestamptz) to service_role;

-- 초대 코드 재발급(유출 대응). 유니크 충돌 시 재생성한다.
create or replace function public.rotate_invite_code(p_group_id uuid)
returns text
language plpgsql
as $$
declare
  v_code text;
begin
  loop
    v_code := public.gen_invite_code();
    exit when not exists (
      select 1 from public.groups g where g.invite_code = v_code
    );
  end loop;

  update public.groups set invite_code = v_code where id = p_group_id;
  return v_code;
end;
$$;

grant execute on function public.rotate_invite_code(uuid) to service_role;

-- 초대 코드로 참여(멱등). 이미 멤버면 기존 멤버십을, 아니면 member 로 추가 후 방을 반환한다.
-- 코드가 유효하지 않으면 행을 반환하지 않는다(호출측이 404 로 존재를 은닉).
create or replace function public.join_group(
  p_user_id     uuid,
  p_invite_code text
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
  v_group   public.groups%rowtype;
  v_role    text;
begin
  select * into v_group from public.groups g where g.invite_code = p_invite_code;
  if not found then
    return;
  end if;

  select gm.role into v_role
  from public.group_members gm
  where gm.group_id = v_group.id and gm.user_id = p_user_id;

  if v_role is null then
    insert into public.group_members (group_id, user_id, role)
    values (v_group.id, p_user_id, 'member');
    v_role := 'member';
  end if;

  return query
  select
    v_group.id,
    v_group.name,
    v_group.invite_code,
    v_role,
    (select count(*) from public.group_members m where m.group_id = v_group.id),
    v_group.created_at;
end;
$$;

grant execute on function public.join_group(uuid, text) to service_role;

-- 멤버 목록(프로필 조인). 같은 방 멤버끼리는 실명(display_name)을 서로 볼 수 있다.
create or replace function public.list_group_members(p_group_id uuid)
returns table (
  user_id      uuid,
  display_name text,
  masked_name  text,
  role         text,
  joined_at    timestamptz
)
language sql
stable
as $$
  select gm.user_id, p.display_name, p.masked_name, gm.role, gm.joined_at
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id
  order by gm.joined_at asc;
$$;

grant execute on function public.list_group_members(uuid) to service_role;
