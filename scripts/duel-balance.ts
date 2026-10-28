// 일기토 밸런스 측정표. 시뮬레이션은 worker_threads로 나눠 돌린다.
// 사용: npx tsx --tsconfig tsconfig.json scripts/duel-balance.ts [seeds=500] [--only 표이름,...]
// 표: main(기본 표), skill(실력 단계), combo(시작 장수 × 동행 조합), reward(보상 성향), recruit(영입 장수 하나 더하기)
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { simulateRun, summarizeRuns, type RunSummary, type SimOptions } from '../src/lib/duel/autoplay';
import { SKILL_TARGETS } from '../src/lib/duel/balance';
import { BOSS_WAVES } from '../src/lib/duel/run';

interface Job {
  id: number;
  starter: string;
  opts: SimOptions;
  seeds: number;
}

if (!isMainThread) {
  parentPort!.on('message', (job: Job) => {
    const rs = Array.from({ length: job.seeds }, (_, i) => simulateRun(job.starter, i + 1, job.opts));
    // 동행 조합 표용: 판 끝 장수록(영입한 장수)
    const rosters = rs.map((r) => r.roster);
    parentPort!.postMessage({ id: job.id, sum: summarizeRuns(rs), rosters });
  });
}

const STARTERS = ['guanyu', 'zhangfei', 'zhaoyun'];
const RECRUITS = ['machao', 'huangzhong', 'xuchu', 'xiaohoudun', 'zhouyu', 'jiangwei'];
const ROSTER = ['zhaoyun', 'machao', 'zhouyu'];
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
const pass = (s: RunSummary, w: number) => s.boss.find((b) => b.wave === w)!;

async function main() {
  const args = process.argv.slice(2);
  const N = Number(args.find((a) => /^\d+$/.test(a)) ?? 500);
  const o = args.indexOf('--only');
  const only = o >= 0 ? new Set(args[o + 1].split(',')) : null;
  const want = (t: string) => !only || only.has(t);
  const workers = Array.from(
    { length: Math.max(1, availableParallelism() - 1) },
    () => new Worker(__filename, { execArgv: process.execArgv }),
  );
  const t0 = Date.now();

  /** 여러 설정을 한꺼번에 돌린다 */
  async function runAll(jobs: Omit<Job, 'id' | 'seeds'>[]): Promise<{ sum: RunSummary; rosters: string[][] }[]> {
    const out: { sum: RunSummary; rosters: string[][] }[] = new Array(jobs.length);
    let next = 0;
    await Promise.all(
      workers.map(
        (w) =>
          new Promise<void>((resolve) => {
            const feed = () => {
              if (next >= jobs.length) return resolve();
              const id = next++;
              w.once('message', (m: { id: number; sum: RunSummary; rosters: string[][] }) => {
                out[m.id] = { sum: m.sum, rosters: m.rosters };
                feed();
              });
              w.postMessage({ ...jobs[id], id, seeds: N });
            };
            feed();
          }),
      ),
    );
    return out;
  }

  console.log(`seeds=${N}  (보스 칸: 도달률/도달 시 승률, smart는 실력 average·보상 heal)`);

  if (want('main')) {
    console.log('\n## 기본 표');
    console.log(
      ['starter ', 'roster', 'mode ', ...BOSS_WAVES.map((w) => `boss${w}`.padEnd(9)), 'clear', 'med ', 'iqr ', 'turns'].join(' | '),
    );
    const cases = (['empty', 'roster'] as const).flatMap((rc) =>
      (['smart', 'basic'] as const).flatMap((mode) =>
        STARTERS.map((s) => ({ s, rc, mode, opts: { mode, roster: rc === 'roster' ? ROSTER.filter((x) => x !== s) : [] } })),
      ),
    );
    const res = await runAll(cases.map((c) => ({ starter: c.s, opts: c.opts })));
    cases.forEach((c, i) => {
      const m = res[i].sum;
      console.log(
        [
          c.s.padEnd(8),
          c.rc.padEnd(6),
          c.mode,
          ...m.boss.map((b) => `${pct(b.reached)}/${pct(b.pass)}`),
          pct(m.clear).padEnd(5),
          String(m.median).padEnd(4),
          String(m.iqr).padEnd(4),
          m.meanTurns.toFixed(0),
        ].join(' | '),
      );
    });
  }

  if (want('skill')) {
    console.log('\n## 실력 단계 (첫 판): 장각 통과 / 동탁 승률(도달 시) / 클리어 / 중앙값 / 평균 턴   [목표]');
    const profiles = ['novice', 'average', 'expert'] as const;
    const cases = profiles.flatMap((skill) => STARTERS.map((s) => ({ s, skill })));
    const res = await runAll(cases.map((c) => ({ starter: c.s, opts: { skill: c.skill } })));
    cases.forEach((c, i) => {
      const m = res[i].sum;
      const t = SKILL_TARGETS[c.skill];
      const goal = `[장각 ${t.zhangjiao.join('~')} 동탁 ${t.dongzhuo ? t.dongzhuo.join('~') : '-'} 클리어 ${t.clear.join('~')}]`;
      console.log(
        `  ${c.skill.padEnd(7)} ${c.s.padEnd(8)} ${pct(pass(m, 6).pass)} / ${pct(pass(m, 18).pass)} / ${pct(m.clear)} / ${String(m.median).padStart(2)} / ${m.meanTurns.toFixed(0).padStart(3)}   ${goal}`,
      );
    });
  }

  if (want('combo')) {
    // 첫 판에서 가장 자주 함께한 영입 장수 쌍 셋
    const first = await runAll(STARTERS.map((s) => ({ starter: s, opts: {} })));
    const pairCount = new Map<string, number>();
    for (const r of first) {
      for (const roster of r.rosters) {
        const rec = roster.filter((id) => RECRUITS.includes(id)).sort();
        for (let a = 0; a < rec.length; a++)
          for (let b = a + 1; b < rec.length; b++) pairCount.set(`${rec[a]}+${rec[b]}`, (pairCount.get(`${rec[a]}+${rec[b]}`) ?? 0) + 1);
      }
    }
    const pairs = [...pairCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const combos = [...RECRUITS.map((r) => [r]), ...pairs.map((p) => p.split('+'))];
    console.log(`\n## 시작 장수 × 동행 (average, 처음부터 동행·레벨 1): 클리어율   (쌍은 첫 판에서 자주 함께한 순: ${pairs.join(', ')})`);
    console.log(`  ${'starter'.padEnd(8)} 혼자  ${combos.map((c) => c.join('+').padEnd(10)).join(' ')}`);
    const cases = STARTERS.flatMap((s) => combos.map((c) => ({ s, c })));
    const res = await runAll(cases.map((x) => ({ starter: x.s, opts: { roster: x.c } })));
    const flags: string[] = [];
    STARTERS.forEach((s, si) => {
      const solo = first[si].sum.clear;
      const row = combos.map((c, ci) => res[si * combos.length + ci].sum.clear);
      const anyPositive = row.some((x) => x > 0);
      row.forEach((x, ci) => {
        if (solo > 0 && x > 2 * solo) flags.push(`${s}+${combos[ci].join('+')} ${pct(x)} > 2×혼자 ${pct(solo)}`);
        if (x === 0 && anyPositive) flags.push(`${s}+${combos[ci].join('+')} 0% (다른 조합은 클리어)`);
      });
      console.log(`  ${s.padEnd(8)} ${pct(solo)}  ${row.map((x) => pct(x).padEnd(10)).join(' ')}`);
    });
    console.log(flags.length ? `  표시: ${flags.join(' | ')}` : '  표시 없음');
  }

  if (want('reward')) {
    console.log('\n## 보상 성향 (average, 첫 판): 클리어율 / 중앙값');
    const prefs = ['heal', 'attack', 'random'] as const;
    const cases = STARTERS.flatMap((s) => prefs.map((p) => ({ s, p })));
    const res = await runAll(cases.map((c) => ({ starter: c.s, opts: { rewardPref: c.p } })));
    STARTERS.forEach((s, si) => {
      const cells = prefs.map((p, pi) => {
        const m = res[si * prefs.length + pi].sum;
        return `${p} ${pct(m.clear)} / ${m.median}`;
      });
      const cl = prefs.map((_, pi) => res[si * prefs.length + pi].sum.clear);
      console.log(`  ${s.padEnd(8)} ${cells.join(' | ')}   차이 ${pct(Math.max(...cl) - Math.min(...cl))}`);
    });
  }

  if (want('recruit')) {
    console.log('\n## 영입 장수 하나를 더한 동행 (average): 중앙값 도달 웨이브 (없음 → 각 장수)');
    const cases = STARTERS.flatMap((s) => [[], ...RECRUITS.map((r) => [r])].map((roster) => ({ s, roster })));
    const res = await runAll(cases.map((c) => ({ starter: c.s, opts: { roster: c.roster } })));
    STARTERS.forEach((s, si) => {
      const base = res[si * 7].sum.median;
      const row = RECRUITS.map((r, ri) => `${r} ${res[si * 7 + ri + 1].sum.median}`);
      console.log(`  ${s.padEnd(8)} 없음 ${base} | ${row.join(' | ')}`);
    });
  }

  await Promise.all(workers.map((w) => w.terminate()));
  console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

if (isMainThread) void main();
