-- 오늘의 운세 웹 푸시 구독. Supabase SQL Editor에서 한 번 실행(배포 전 사용자 승인 뒤).
-- 설계: docs/superpowers/specs/2026-11-05-daily-push-design.md
-- 초안으로 만든 표가 이미 있으면 아래 한 줄을 먼저 실행한다(없으면 무해).
alter table if exists push_subscriptions add column if not exists last_fail_on date;

create table if not exists push_subscriptions (
  endpoint text primary key,             -- 푸시 서비스 주소. 기기 식별자 성격이라 로그에 남기지 않는다
  p256dh text not null,
  auth text not null,
  ganji text not null check (char_length(ganji) = 2),  -- 년주 60갑자, 예 '경오'
  created_at timestamptz not null default now(),
  last_sent_on date,                     -- KST 날짜. 같은 날 두 번 보내지 않는 기준
  fail_count int not null default 0,
  last_fail_on date                      -- 실패 집계는 하루 1회(보정 발송이 같은 날 여러 번 돌아도 한 번만 센다)
);
create index if not exists push_subscriptions_pending_idx on push_subscriptions (last_sent_on);
alter table push_subscriptions enable row level security;  -- 정책 없음: service key만

create table if not exists push_send_log (
  id bigserial primary key,
  day date not null,
  finished_at timestamptz not null default now(),   -- 행을 넣은 시각(= 호출이 끝난 시각)
  sent int not null, failed int not null, removed int not null, ms int not null
);
alter table push_send_log enable row level security;

-- 발송 실패 기록: 하루 1회만 fail_count + 1, 5 이상이면 삭제
create or replace function push_bump_fail(p_endpoint text, p_day date) returns void
language plpgsql security definer set search_path = public as $$
begin
  update push_subscriptions
     set fail_count = fail_count + 1, last_fail_on = p_day
   where endpoint = p_endpoint and last_fail_on is distinct from p_day;
  delete from push_subscriptions where endpoint = p_endpoint and fail_count >= 5;
end;
$$;
revoke all on function push_bump_fail(text, date) from public, anon, authenticated;
grant execute on function push_bump_fail(text, date) to service_role;

-- ===== 한 번만 실행 (Vault 비밀) =====
-- 두 번 실행하면 같은 이름이 중복된다. 값은 Vercel PUSH_CRON_SECRET과 같게.
-- select vault.create_secret('<PUSH_CRON_SECRET>', 'push_cron_secret');

-- ===== pg_cron·pg_net 설정 (SQL Editor, 웹 검증 뒤 사용자 승인 후 실행) =====
-- 비밀값은 Supabase Vault에 넣고 SQL에서 읽는다. pg_cron은 UTC 기준: 23:30 UTC = 08:30 KST.
-- 호출 주소는 정규 도메인(www는 307이라 pg_net이 따라가지 않는다).
-- (확장은 SQL 또는 Dashboard > Database > Extensions에서 켠다.)
-- 순서: 확장 켜기 -> 아래 '한 번만 실행' 블록으로 Vault 비밀 넣기 -> cron 블록 실행.
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('daily-push-0830', '30 23 * * *', $$
--   select net.http_post(
--     url := 'https://unse-ai.com/api/push/send',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret'), 'Content-Type', 'application/json'),
--     body := '{}'::jsonb, timeout_milliseconds := 60000)   -- 함수 maxDuration 60초와 맞춤. 응답은 믿지 않고 push_send_log로 확인
-- $$);
-- -- 보정 발송(이미 보낸 기기는 last_sent_on으로 건너뜀)
-- select cron.schedule('daily-push-0845-retry', '45 23 * * *', $$
--   select net.http_post(
--     url := 'https://unse-ai.com/api/push/send',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret'), 'Content-Type', 'application/json'),
--     body := '{}'::jsonb, timeout_milliseconds := 60000)
-- $$);
-- -- 2차 보정. 그 뒤에도 남으면 그날은 포기한다
-- select cron.schedule('daily-push-0900-retry', '0 0 * * *', $$
--   select net.http_post(
--     url := 'https://unse-ai.com/api/push/send',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret'), 'Content-Type', 'application/json'),
--     body := '{}'::jsonb, timeout_milliseconds := 60000)
-- $$);
