// 일기토 난이도 설계표 보기: 설계 합 수 → 기준 아군 → 풀어 낸 적 레벨·공격 보정 → 시작 장수별 합 수 → 검증.
// 사용: npx tsx --tsconfig tsconfig.json scripts/duel-tune.ts [검증 시드=60] [--json 덮어쓰기.json]
// 고칠 곳: src/lib/duel/balance.ts의 waveDesign(합 수)·경험치·체력 공식·generalPower. 고친 뒤 다시 돌려 확인한다.
import { readFileSync } from 'node:fs';
import { simulateRun, summarizeRuns } from '../src/lib/duel/autoplay';
import { applyBalance, BALANCE, type BalanceOverride } from '../src/lib/duel/balance';
import { makeFighter, matchup, skillsOf } from '../src/lib/duel/battle';
import { SKILLS } from '../src/lib/duel/skills';
import { basicHit, designedEnemy, makeDesignedEnemy, refFighter, refLevel } from '../src/lib/duel/design';
import { BOSS_IDS, getDuelGeneral, MOB_ID, STARTER_IDS } from '../src/lib/duel/generals';
import { BOSS_WAVES, WAVES } from '../src/lib/duel/run';

const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a)) ?? 60);
const j = args.indexOf('--json');
if (j >= 0) applyBalance(JSON.parse(readFileSync(args[j + 1], 'utf8')) as BalanceOverride);

const isBoss = (w: number) => (BOSS_WAVES as readonly number[]).indexOf(w);
const kind = (id: string) => getDuelGeneral(id)!.kind;

// 1) 설계표와 풀어 낸 적
console.log('웨이브 | 설계 합(쓰러뜨림/쓰러짐) | 기준 아군 Lv·체력·1합 | 대표 적 → Lv·공격 보정');
let total = 0;
for (let w = 1; w <= WAVES; w++) {
  const des = BALANCE.waveDesign[w - 1];
  total += des.hitsToKillEnemy;
  const me = refFighter(w);
  const b = isBoss(w);
  const ids = b >= 0 ? [BOSS_IDS[b]] : w <= 3 || w >= 10 ? [MOB_ID] : ['huangzhong', 'zhouyu', MOB_ID];
  const foes = ids
    .map((id) => {
      const e = designedEnemy(w, id);
      return `${id} Lv${e.level} ${e.bonus >= 0 ? '+' : ''}${e.bonus}`;
    })
    .join(', ');
  console.log(
    `${String(w).padStart(2)}${b >= 0 ? '★' : ' '} | ${String(des.hitsToKillEnemy).padStart(2)} / ${String(des.hitsToKillPlayer).padStart(2)} | Lv${String(refLevel(w)).padStart(2)} ${String(me.maxHp).padStart(4)} ${basicHit(me, makeFighter(MOB_ID, 1)).toFixed(0).padStart(3)}(졸개) | ${foes}`,
  );
}
console.log(`설계 합 수 합계(36웨이브, 기본 공격만): ${total}\n`);

// 2) 시작 장수별: 보스 웨이브에서 같은 레벨일 때 실제 상성으로 몇 합인가
console.log('시작 장수 × 보스: 쓰러뜨리는 합 / 쓰러지는 합 (같은 레벨·보상 가정, 실제 상성, 숨 고르기 회복 포함), 끝은 쓰러뜨림÷쓰러짐의 기하평균');
const geo: Record<string, number> = {};
for (const s of STARTER_IDS) {
  let logSum = 0;
  const cells = BOSS_WAVES.map((w, i) => {
    const me = makeFighter(s, refLevel(w));
    me.bonus.atk = me.bonus.int = refFighter(w).bonus.atk;
    const foe = makeDesignedEnemy(w, BOSS_IDS[i]);
    const m1 = matchup(kind(s), kind(foe.id));
    const m2 = matchup(kind(foe.id), kind(s));
    const kill = foe.maxHp / (basicHit(me, foe) * m1);
    // 숨 고르기가 있으면 남은 횟수만큼 체력을 더 가진 셈(횟수 × 회복률)
    const heal = skillsOf(me).includes('breathe') ? 1 + BALANCE.healRate * (SKILLS.breathe.uses ?? 0) : 1;
    const die = (me.maxHp * heal) / (basicHit(foe, me) * m2);
    logSum += Math.log(kill / die);
    return `${w}:${kill.toFixed(1)}/${die.toFixed(1)}`;
  });
  geo[s] = Math.exp(logSum / BOSS_WAVES.length);
  console.log(`  ${s.padEnd(8)} ${cells.join('  ')}  기하평균 ${geo[s].toFixed(2)}`);
}
// 쓰러지는 합은 체력에 비례: 기준 장수와 기하평균이 같아지는 체력 배율(지금 배율에 곱한다)
for (const s of STARTER_IDS) {
  if (s === BALANCE.refGeneral) continue;
  const now = BALANCE.generalHp[s] ?? 1;
  console.log(`  ${s} 체력 배율 제안: ${now} × ${(geo[s] / geo[BALANCE.refGeneral]).toFixed(2)} = ${(now * (geo[s] / geo[BALANCE.refGeneral])).toFixed(2)}`);
}

// 3) 검증
console.log(`\n검증 (smart, 시드 ${N}개)`);
for (const s of STARTER_IDS) {
  const seeds = Array.from({ length: N }, (_, i) => i + 1);
  const e = summarizeRuns(seeds.map((x) => simulateRun(s, x)));
  const b = summarizeRuns(seeds.map((x) => simulateRun(s, x, { mode: 'basic' })));
  const r = summarizeRuns(seeds.map((x) => simulateRun(s, x, { roster: ['zhaoyun', 'machao', 'zhouyu'].filter((y) => y !== s) })));
  const p = (w: number) => `${Math.round(e.boss.find((x) => x.wave === w)!.pass * 100)}%`;
  console.log(
    `  ${s.padEnd(8)} 보스 통과 ${BOSS_WAVES.map((w) => `${w}:${p(w)}`).join(' ')} | 클리어 ${Math.round(e.clear * 100)}% 중앙값 ${e.median} IQR ${e.iqr} 평균 턴 ${e.meanTurns.toFixed(0)} smart−basic ${e.median - b.median} 교착 ${Math.round(e.stalled * 100)}% | 장수록 클리어 ${Math.round(r.clear * 100)}%`,
  );
}
