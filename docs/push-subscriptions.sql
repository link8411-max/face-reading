-- 오늘의 운세 웹 푸시 구독. Supabase SQL Editor에서 한 번 실행(배포 전 사용자 승인 뒤).
-- 설계: docs/superpowers/specs/2026-11-05-daily-push-design.md

create table if not exists push_subscriptions (
  endpoint text primary key,             -- 푸시 서비스 주소. 기기 식별자 성격이라 로그에 남기지 않는다
  p256dh text not null,
  auth text not null,
  ganji text not null check (char_length(ganji) = 2),  -- 년주 60갑자, 예 '경오'
  created_at timestamptz not null default now(),
  last_sent_on date,                     -- KST 날짜. 같은 날 두 번 보내지 않는 기준
  fail_count int not null default 0
);
create index if not exists push_subscriptions_pending_idx on push_subscriptions (last_sent_on);
alter table push_subscriptions enable row level security;  -- 정책 없음: service key만

create table if not exists push_send_log (
  id bigserial primary key,
  day date not null,
  started_at timestamptz not null default now(),
  sent int not null, failed int not null, removed int not null, ms int not null
);
alter table push_send_log enable row level security;

-- 발송 실패 1회 기록: fail_count + 1, 5 이상이면 삭제
create or replace function push_bump_fail(p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update push_subscriptions set fail_count = fail_count + 1 where endpoint = p_endpoint;
  delete from push_subscriptions where endpoint = p_endpoint and fail_count >= 5;
end;
$$;
revoke all on function push_bump_fail(text) from public, anon, authenticated;
grant execute on function push_bump_fail(text) to service_role;

-- ===== pg_cron·pg_net 설정 (SQL Editor, 웹 검증 뒤 사용자 승인 후 실행) =====
-- 비밀값은 Supabase Vault에 넣고 SQL에서 읽는다. pg_cron은 UTC 기준: 23:30 UTC = 08:30 KST.
-- 호출 주소는 정규 도메인(www는 307이라 pg_net이 따라가지 않는다).
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select vault.create_secret('<PUSH_CRON_SECRET>', 'push_cron_secret');  -- 한 번만, 값은 Vercel 환경변수와 같게
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
