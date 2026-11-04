-- 삼국지 장수 월드컵 집계 함수. people_votes 표(docs/people-votes.sql)가 이미 있어야 한다.
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
