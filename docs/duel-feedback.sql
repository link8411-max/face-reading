-- 일기토 플레이어 피드백 테이블 (Supabase SQL Editor에서 실행)
create table if not exists duel_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating int not null check (rating between 1 and 5),
  note text not null default '',
  wave int not null check (wave between 1 and 18),
  starter text not null,
  cleared boolean not null,
  device text not null check (device in ('mobile', 'desktop'))
);

alter table duel_feedback enable row level security;

-- 정책을 만들지 않는다: anon/authenticated는 접근 불가.
-- 서버 API(/api/duel/feedback)가 service key로만 insert 한다 (service key는 RLS를 우회).

-- [참고] service key 대신 anon key로 바꾸고 싶다면(적용하지 않음): insert 전용 RLS 정책 예시.
-- 이 경우 SUPABASE_SERVICE_KEY 자리에 anon key를 넣고, select/update/delete 정책은 만들지 않는다.
--
-- create policy "duel_feedback_insert_only" on duel_feedback
--   for insert to anon
--   with check (
--     rating between 1 and 5
--     and char_length(note) <= 200
--     and wave between 1 and 36
--     and device in ('mobile', 'desktop')
--   );
-- revoke select, update, delete on duel_feedback from anon;
