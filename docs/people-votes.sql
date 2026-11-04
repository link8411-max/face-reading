-- 인물열전 응원·투표 테이블 (Supabase SQL Editor에서 한 번 실행). IP·쿠키 원본은 저장하지 않고,
-- voter_hash(날마다 바뀌는 비밀 값으로 섞은 해시)만 저장한다.
create table if not exists people_votes (
  id bigserial primary key,
  kind text not null check (kind in ('cheer', 'duel', 'scene', 'verdict', 'cup_match', 'cup_win')),
  -- cheer·scene·verdict: 인물 id / duel: 두 id를 정렬해 이은 `a__b`
  -- cup_match: 두 id 쌍(판 무관) / cup_win: 판 키 (삼국지 장수 월드컵, 미리 허용만 해 둠)
  target text not null,
  -- cheer: 'cheer' / duel: 둘 중 고른 인물 id / scene·verdict: 선택지 key
  option text not null,
  voter_hash text not null,
  day date not null,
  created_at timestamptz not null default now(),
  unique (kind, target, voter_hash, day)
);

create index if not exists people_votes_target_idx on people_votes (target);

alter table people_votes enable row level security;

-- 정책을 만들지 않는다: anon/authenticated는 접근 불가.
-- 서버 API(/api/people/vote, /api/people/stats)가 service key로만 읽고 쓴다 (service key는 RLS를 우회).

-- 한 인물의 집계: 응원·장면·한 줄 평은 target = p_id, 대결은 그 인물의 라이벌 쌍(p_pair)만 센다.
create or replace function people_stats(p_id text, p_pair text)
returns table (kind text, option text, n bigint)
language sql
stable
as $$
  select v.kind, v.option, count(*) as n
  from people_votes v
  where (v.kind in ('cheer', 'scene', 'verdict') and v.target = p_id)
     or (v.kind = 'duel' and v.target = p_pair)
  group by v.kind, v.option
$$;

-- 응원 수 순위(많은 순)
create or replace function people_cheer_ranking()
returns table (target text, n bigint)
language sql
stable
as $$
  select v.target, count(*) as n
  from people_votes v
  where v.kind = 'cheer'
  group by v.target
  order by n desc, v.target asc
$$;

-- RPC로 직접 부르지 못하게 service key(서버)만 실행 가능하게 한다
revoke execute on function people_stats(text, text) from public, anon, authenticated;
revoke execute on function people_cheer_ranking() from public, anon, authenticated;
grant execute on function people_stats(text, text) to service_role;
grant execute on function people_cheer_ranking() to service_role;

-- ===== 삼국지 장수 월드컵 집계 (kind 'cup_match'·'cup_win', 위 표를 그대로 쓴다) =====
-- cup_match: target = 두 id를 정렬해 이은 `a__b`(판 무관), option = 고른 id
-- cup_win: target = 판 키(warrior·strategist·women·random), option = 우승 id
-- 모두 idempotent: 다시 실행해도 된다.

create index if not exists people_votes_kind_target_idx on people_votes (kind, target);

-- 한 쌍의 선택 집계(고른 id별 표 수)
create or replace function cup_pair_stats(p_pair text)
returns table (option text, n bigint)
language sql
stable
as $$
  select v.option, count(*) as n
  from people_votes v
  where v.kind = 'cup_match' and v.target = p_pair
  group by v.option
$$;

-- 판별 우승 집계
create or replace function cup_win_counts()
returns table (target text, option text, n bigint)
language sql
stable
as $$
  select v.target, v.option, count(*) as n
  from people_votes v
  where v.kind = 'cup_win'
  group by v.target, v.option
$$;

-- 경기에서 이긴(고른) 횟수 상위 50
create or replace function cup_match_wins()
returns table (option text, n bigint)
language sql
stable
as $$
  select v.option, count(*) as n
  from people_votes v
  where v.kind = 'cup_match'
  group by v.option
  order by n desc, v.option asc
  limit 50
$$;

revoke execute on function cup_pair_stats(text) from public, anon, authenticated;
revoke execute on function cup_win_counts() from public, anon, authenticated;
revoke execute on function cup_match_wins() from public, anon, authenticated;
grant execute on function cup_pair_stats(text) to service_role;
grant execute on function cup_win_counts() to service_role;
grant execute on function cup_match_wins() to service_role;
