-- 기사를 내리는 권한을 "올린 제보자 본인"으로 좁힌다.
--
-- 1) get_article_detail 에 is_mine(요청자가 이 기사를 올린 제보자인지)을 추가한다.
--    화면이 내리기 진입점을 노출할지 판단하려면 소유 여부를 알아야 한다. reporter_id 자체를
--    내려보내면 방 안에서 식별자가 새므로, 요청자 기준 파생 불리언만 노출한다.
-- 2) request_deletion 이 소유권을 직접 확인하게 한다. 서버는 service_role 로 접속해 RLS 가
--    무력하므로, 애플리케이션 검사 한 겹에만 기대지 않고 이 함수에서도 막는다.

create or replace function public.get_article_detail(
  p_article_id uuid,
  p_user_id    uuid
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', a.id,
    'report_id', a.report_id,
    'group_id', a.group_id,
    'outlet_key', a.outlet_key,
    'headline', a.headline,
    'body', a.body,
    'reporter_name', a.reporter_name,
    'reporter', (
      select jsonb_build_object('masked_name', pr.masked_name)
      from public.reports r
      join public.profiles pr on pr.id = r.reporter_id
      where r.id = a.report_id
    ),
    -- 정정 기사는 원 기사와 report_id 를 공유한다 — 제보자를 소유자로 보면 반박당한 쪽이
    -- 남의 반박을 내릴 수 있게 되므로, 정정 기사는 누구의 것도 아니다(내릴 수 없다).
    'is_mine', coalesce((
      select r.reporter_id = p_user_id and a.is_correction = false
      from public.reports r
      where r.id = a.report_id
    ), false),
    'published_at', a.published_at,
    'is_correction', a.is_correction,
    'corrects_article_id', a.corrects_article_id,
    'is_active', a.is_active,
    'reaction_counts', public.reaction_counts(a.id),
    'my_reactions', public.my_reactions(a.id, p_user_id),
    'comment_count', (select count(*) from public.comments c where c.article_id = a.id),
    'correction_chain', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', cc.id, 'is_correction', cc.is_correction, 'headline', cc.headline)
        order by cc.published_at asc
      )
      from public.article_correction_chain(a.id) cc
    ), '[]'::jsonb)
  )
  from public.articles a
  where a.id = p_article_id and a.is_active = true;
$$;

grant execute on function public.get_article_detail(uuid, uuid) to service_role;

-- 기사 내리기: 올린 제보자 본인만. 소유자가 아니거나 이미 내려간 기사면 아무것도 바꾸지 않고
-- 예외를 낸다(이전 정의는 대상이 무엇이든 무조건 내리고 성공을 반환했다).
create or replace function public.request_deletion(
  p_article_id   uuid,
  p_requested_by uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_updated uuid;
begin
  update public.articles a
  set is_active = false
  where a.id = p_article_id
    and a.is_active = true
    and a.is_correction = false
    and exists (
      select 1
      from public.reports r
      where r.id = a.report_id and r.reporter_id = p_requested_by
    )
  returning a.id into v_updated;

  if v_updated is null then
    raise exception 'only the reporter can take down this article'
      using errcode = '42501';
  end if;

  -- 실제로 내려간 경우에만 기록한다 — 거부된 시도가 요청 이력에 남지 않게.
  insert into public.deletion_requests (article_id, requested_by)
  values (p_article_id, p_requested_by);

  return jsonb_build_object('article_id', p_article_id, 'is_active', false);
end;
$$;

grant execute on function public.request_deletion(uuid, uuid) to service_role;
