-- 일기토 판 요약 테이블 (Supabase SQL Editor에서 실행). 개인정보·IP·runId는 저장하지 않는다.
create table if not exists duel_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- BALANCE 수치 해시(8자): 어느 밸런스 버전의 기록인지
  version text not null check (version ~ '^[0-9a-f]{8}$'),
  starter text not null,
  reached_wave int not null check (reached_wave between 1 and 36),
  cleared boolean not null,
  last_enemy text not null,
  turns int not null check (turns between 1 and 2000),
  duration_bucket text not null check (duration_bucket in ('<10m', '10-30m', '30-60m', '60-90m', '>90m')),
  rewards text[] not null default '{}' check (cardinality(rewards) <= 40),
  recruits text[] not null default '{}' check (cardinality(recruits) <= 10),
  device text not null check (device in ('mobile', 'desktop')),
  resumed boolean not null
);

create index if not exists duel_runs_starter_idx on duel_runs (starter);
create index if not exists duel_runs_reached_wave_idx on duel_runs (reached_wave);
create index if not exists duel_runs_version_idx on duel_runs (version);

alter table duel_runs enable row level security;

-- 정책을 만들지 않는다: anon/authenticated는 접근 불가.
-- 서버 API(/api/duel/run)가 service key로만 insert 하고, 리포트(scripts/duel-real-stats.ts)도 service key로 읽는다 (service key는 RLS를 우회).
