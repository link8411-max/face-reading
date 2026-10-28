// 일기토 밸런스 측정: 시작 장수 3명 × {빈 장수록, 장수록 조운·마초·주유} × {smart, basic} × 시드 N개
// 사용: npx tsx --tsconfig tsconfig.json scripts/duel-balance.ts [seeds=200]
import { simulateRun, summarizeRuns } from '../src/lib/duel/autoplay';
import { BOSS_WAVES } from '../src/lib/duel/run';

const N = Number(process.argv[2] ?? 200);
const STARTERS = ['guanyu', 'zhangfei', 'zhaoyun'];
const ROSTER = ['zhaoyun', 'machao', 'zhouyu'];
const RECRUITS = ['machao', 'huangzhong', 'xuchu', 'xiaohoudun', 'zhouyu', 'jiangwei'];

const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
const seeds = Array.from({ length: N }, (_, i) => i + 1);

const t0 = Date.now();
console.log(`seeds=${N}  (보스 칸: 도달률/도달 시 승률)`);
console.log(
  ['starter ', 'roster', 'mode ', ...BOSS_WAVES.map((w) => `boss${w}`.padEnd(9)), 'clear', 'med ', 'iqr ', 'turns'].join(' | '),
);
for (const rosterCase of ['empty', 'roster'] as const) {
  for (const mode of ['smart', 'basic'] as const) {
    for (const s of STARTERS) {
      const roster = rosterCase === 'roster' ? ROSTER.filter((id) => id !== s) : [];
      const m = summarizeRuns(seeds.map((seed) => simulateRun(s, seed, { roster, mode })));
      console.log(
        [
          s.padEnd(8),
          rosterCase.padEnd(6),
          mode,
          ...m.boss.map((b) => `${pct(b.reached)}/${pct(b.pass)}`),
          pct(m.clear).padEnd(5),
          String(m.median).padEnd(4),
          String(m.iqr).padEnd(4),
          m.meanTurns.toFixed(0),
        ].join(' | '),
      );
    }
  }
}
if (process.argv.includes('--recruits')) {
  console.log('\n영입 장수 하나를 더한 동행(smart): 중앙값 도달 웨이브 (없음 → 각 장수)');
  for (const s of STARTERS) {
    const base = summarizeRuns(seeds.map((seed) => simulateRun(s, seed))).median;
    const row = RECRUITS.map((r) => `${r} ${summarizeRuns(seeds.map((seed) => simulateRun(s, seed, { roster: [r] }))).median}`);
    console.log(`${s.padEnd(8)} 없음 ${base} | ${row.join(' | ')}`);
  }
}
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
