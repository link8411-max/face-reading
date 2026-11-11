-- 밈 능력고사 응시 기록 (Supabase real-estate 프로젝트, 2026-11-11). 다시 실행해도 된다.
-- 한 행 = 한 기기의 한 회차 한 판. 개인 식별값은 없다: device_hash는 서명 쿠키 uuid를 비밀 값으로 섞은 해시다.
create table if not exists exam_plays (
  id bigserial primary key,
  subject text not null check (subject in ('meme')),
  round int not null check (round between 1 and 9999),
  marks text not null check (marks ~ '^[OX]{5}$'), -- 문제별 정오, 1번 문제가 첫 글자
  score int not null check (score between 0 and 600),
  grade smallint not null check (grade between 1 and 9),
  device_hash text not null,
  day date not null, -- 저장한 날(KST)
  created_at timestamptz not null default now(),
  unique (subject, round, device_hash)
);

alter table exam_plays enable row level security;
-- 정책을 만들지 않는다: anon/authenticated는 접근 불가. 서버 API가 service key로만 읽고 쓴다.

-- 한 회차의 문제별 응시 수·정답 수
create or replace function exam_round_rates(p_subject text, p_round int)
returns table (q int, n bigint, correct bigint)
language sql
stable
as $$
  select g.q, count(p.id) as n, count(p.id) filter (where substr(p.marks, g.q, 1) = 'O') as correct
  from generate_series(1, 5) as g(q)
  left join exam_plays p on p.subject = p_subject and p.round = p_round
  group by g.q
  order by g.q
$$;

revoke execute on function exam_round_rates(text, int) from public, anon, authenticated;
grant execute on function exam_round_rates(text, int) to service_role;
