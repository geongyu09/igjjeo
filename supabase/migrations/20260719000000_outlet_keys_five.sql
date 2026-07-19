-- 언론사를 MVP 3종에서 프로토타입 5종으로 확장한다(ai-rules.md).
-- science(모임과학)·emotion(주간감성) 추가 — 제보자가 5곳 중 최소 1곳을 직접 고른다.

alter table public.articles
  drop constraint if exists articles_outlet_key_check;

alter table public.articles
  add constraint articles_outlet_key_check
  check (outlet_key in ('daily', 'shock', 'economy', 'science', 'emotion'));
