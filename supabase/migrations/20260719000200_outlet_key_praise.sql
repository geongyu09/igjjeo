-- 언론사에 praise(일간찬양)를 추가해 6종으로 확장한다(ai-rules.md).
-- 대상을 과할 정도로 치켜세우는 찬양·미화 톤 — 제보자가 6곳 중 최소 1곳을 직접 고른다.

alter table public.articles
  drop constraint if exists articles_outlet_key_check;

alter table public.articles
  add constraint articles_outlet_key_check
  check (outlet_key in ('daily', 'shock', 'economy', 'science', 'emotion', 'praise'));
