// 실제 플레이 분포 리포트: Supabase duel_runs를 읽어 봇 표(scripts/duel-balance.ts)와 같은 모양으로 출력한다.
// 사용: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx --tsconfig tsconfig.json scripts/duel-real-stats.ts [--version 해시8자]
// 환경변수가 없으면 안내만 출력하고 끝난다(.env.local이 있으면 읽는다). 서비스 키는 로그에 남기지 않는다.
import { existsSync, readFileSync } from 'node:fs';
import { balanceHash, DURATION_BUCKETS } from '../src/lib/duel/runLog';
import { BOSS_WAVES } from '../src/lib/duel/generals';
import { formatRealRow, groupReal, SURVIVE_WAVES, type RunRow } from '../src/lib/duel/realStats';

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function main() {
  loadEnvFile('.env.local');
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.log('SUPABASE_URL / SUPABASE_SERVICE_KEY가 없어 실제 분포를 읽을 수 없습니다.');
    console.log('docs/duel-runs.sql로 테이블을 만들고 두 환경변수를 설정한 뒤 다시 실행하세요.');
    return;
  }
  const args = process.argv.slice(2);
  const vi = args.indexOf('--version');
  const only = vi >= 0 ? args[vi + 1] : null;

  // 1000행씩 끝까지 읽는다
  const rows: RunRow[] = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(
      `${url}/rest/v1/duel_runs?select=version,starter,reached_wave,cleared,last_enemy,turns,duration_bucket&order=created_at.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` } },
    );
    if (!res.ok) {
      console.error(`읽기 실패: HTTP ${res.status}`);
      process.exitCode = 1;
      return;
    }
    const part = (await res.json()) as RunRow[];
    rows.push(...part);
    if (part.length < 1000) break;
  }

  const current = balanceHash();
  console.log(`판 ${rows.length}개  (지금 코드의 밸런스 해시: ${current})`);
  const g = groupReal(rows);
  for (const [version, byStarter] of [...g].sort((a, b) => b[1].get('*')!.n - a[1].get('*')!.n)) {
    if (only && version !== only) continue;
    console.log(`\n## 버전 ${version}${version === current ? ' (현재)' : ''}`);
    console.log(
      `   시작 장수 | 판수 | ${SURVIVE_WAVES.join('·')}까지 생존 | 클리어 | 보스(${BOSS_WAVES.join('/')}) 패배 비율 | 평균 턴 | 시간 ${DURATION_BUCKETS.join('/')}`,
    );
    for (const [starter, s] of byStarter) console.log(`  ${formatRealRow(starter, s)}`);
  }
  console.log('\n판 수가 적은 칸(30판 미만)은 참고만 하세요. 봇 표와 비교하는 법은 docs/duel-balance.md "실제 데이터로 다시 맞추는 법".');
}

void main();
