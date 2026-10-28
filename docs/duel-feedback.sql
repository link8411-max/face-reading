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
