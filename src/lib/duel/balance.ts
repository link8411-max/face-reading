// 일기토 밸런스 수치 한곳 모음. 규칙(battle·run·rewards)은 부를 때마다 BALANCE를 읽는다.
// 난이도는 WAVE_DESIGN(웨이브마다 "몇 합에 쓰러뜨리나 / 몇 합에 쓰러지나")로 정하고,
// 적의 레벨·능력치 보정은 design.ts가 피해 공식으로 바로 풀어 낸다(시뮬레이션 없음).
// 시뮬레이터(autoplay.ts)는 withBalance로 잠깐 덮어써 볼 수 있다. 기록·사용법은 docs/duel-balance.md.

export interface WaveDesign {
  /** 기준 아군이 기본 공격으로 이 웨이브 적을 쓰러뜨리는 합 수(상성 1, 평균 난수) */
  hitsToKillEnemy: number;
  /** 이 웨이브 적이 기본 공격으로 체력 가득한 기준 아군을 쓰러뜨리는 합 수 */
  hitsToKillPlayer: number;
}

export interface Balance {
  // ── 전투 (battle.ts) ──
  /** maxHp = round(통솔 × hpPerLead + level × hpPerLevel) */
  hpPerLead: number;
  hpPerLevel: number;
  /** 상성 배수: 이기는 유형 / 지는 유형 */
  matchWin: number;
  matchLose: number;
  /** 자속(기술 유형 = 내 유형) 배수 */
  stab: number;
  /** 숨 고르기 회복: maxHp 비율 */
  healRate: number;
  /** 화상: 턴 끝마다 maxHp 비율 */
  burnRate: number;

  // ── 한 판 (run.ts·design.ts) ──
  /** 웨이브 1~36의 설계 합 수 */
  waveDesign: WaveDesign[];
  /** 기준 아군: 이 장수가 경험치 곡선대로 자란 모습(+ 보상으로 오른 공격 가정) */
  refGeneral: string;
  /** 기준 아군이 웨이브마다 보상으로 얻는다고 보는 공격 오름(웨이브 × 이 값) */
  refAtkPerWave: number;
  /** 승리 경험치 = expBase + 웨이브 × expPerWave (expPerLevel마다 레벨업) */
  expBase: number;
  expPerWave: number;
  expPerLevel: number;
  /** 항복 = surrenderBase + (매력−50)/200 − (적 level − 기준 레벨) × surrenderPerLevel, 보스로 나온 영입 장수는 × bossSurrenderFactor */
  surrenderBase: number;
  surrenderPerLevel: number;
  bossSurrenderFactor: number;

  // ── 보상 (rewards.ts) ──
  rareChance: number;
  potionRate: number;
  reviveRate: number;
  redhareSpeed: number;
  steedSpeed: number;
  greendragonAtk: number;
  swordAtk: number;
  bookInt: number;

  // ── 장수·기술 (generals.ts·skills.ts·battle.ts) ──
  /** 기술 id → 위력·횟수 덮어쓰기 (skills.ts 표의 기준값 위에) */
  skills: Record<string, { power?: number; uses?: number | null }>;
  /** 장수 id → 속도 보정 (generals.ts 기준값 대신) */
  speedAdj: Record<string, number>;
  /** 장수 id → 주는 피해 배율(캐릭터 균형용, 없으면 1). 적으로 나올 때도 같다 */
  generalPower: Record<string, number>;
  /** 장수 id → 최대 체력 배율(캐릭터 균형용, 없으면 1). 적으로 나올 때도 같다 */
  generalHp: Record<string, number>;
}

/** [쓰러뜨리는 합, 쓰러지는 합] 줄임 */
const d = (hitsToKillEnemy: number, hitsToKillPlayer: number): WaveDesign => ({ hitsToKillEnemy, hitsToKillPlayer });

export const BALANCE: Balance = {
  hpPerLead: 2,
  hpPerLevel: 40,
  matchWin: 1.2,
  matchLose: 0.83,
  stab: 1.2,
  healRate: 0.3,
  burnRate: 0.08,

  // prettier-ignore
  waveDesign: [
    d(5, 56), d(5, 56), d(6, 56), d(7, 45), d(7, 45), d(9, 30), // 1~6 장각
    d(12, 31), d(12, 31), d(12, 31), d(12, 31), d(12, 31), d(17, 13), // 7~12 하후돈
    d(14, 22), d(14, 22), d(14, 22), d(14, 22), d(14, 22), d(20, 8), // 13~18 동탁
    d(15, 17), d(15, 17), d(15, 17), d(15, 17), d(15, 17), d(20, 6), // 19~24 허저
    d(15, 15), d(15, 15), d(15, 15), d(15, 15), d(15, 15), d(21, 8), // 25~30 마초
    d(16, 14), d(16, 14), d(16, 14), d(16, 14), d(16, 14), d(22, 7), // 31~36 여포
  ],
  refGeneral: 'guanyu',
  refAtkPerWave: 1,
  expBase: 100,
  expPerWave: 0,
  expPerLevel: 100,
  surrenderBase: 0.25,
  surrenderPerLevel: 0.015,
  bossSurrenderFactor: 0.5,

  rareChance: 0.25,
  potionRate: 0.5,
  reviveRate: 0.5,
  redhareSpeed: 15,
  steedSpeed: 8,
  greendragonAtk: 15,
  swordAtk: 8,
  bookInt: 10,

  skills: {
    // 숨 고르기 무제한이면 긴 싸움에서 회복만 되풀이하는 교착이 생긴다
    breathe: { uses: 3 },
  },
  speedAdj: {},
  generalPower: {},
  generalHp: { zhangfei: 1.08, zhaoyun: 0.55 },
};

/** 일부만 덮어쓰는 값 (중첩 객체·배열도 일부만) */
export type BalanceOverride = { [K in keyof Balance]?: unknown };

function merge(target: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(patch)) {
    const cur = target[k];
    if (v && typeof v === 'object' && cur && typeof cur === 'object') {
      if (Array.isArray(cur)) {
        const arr = [...cur];
        for (const [i, x] of Object.entries(v)) arr[Number(i)] = x;
        target[k] = arr;
      } else {
        const next = { ...(cur as Record<string, unknown>) };
        merge(next, v as Record<string, unknown>);
        target[k] = next;
      }
    } else target[k] = v;
  }
}

type Listener = () => void;
const listeners: Listener[] = [];

/** BALANCE가 바뀌면 다시 계산할 것(기술 표·장수 속도)을 등록 */
export function onBalanceChange(fn: Listener): void {
  listeners.push(fn);
}

/** override를 적용하고, 되돌리는 함수를 돌려준다 */
export function applyBalance(override: BalanceOverride): () => void {
  const saved = structuredClone(BALANCE);
  merge(BALANCE as unknown as Record<string, unknown>, override as Record<string, unknown>);
  listeners.forEach((f) => f());
  return () => {
    Object.assign(BALANCE, saved);
    listeners.forEach((f) => f());
  };
}

/**
 * override를 적용한 채로 fn을 돌리고 되돌린다. 동기 함수만: BALANCE는 모듈 전역이라
 * await를 사이에 두면 다른 작업이 덮어쓴 값을 보게 된다(withBalance를 await 너머로 쓰지 말 것).
 */
export function withBalance<T>(override: BalanceOverride | undefined, fn: () => T): T {
  if (!override || Object.keys(override).length === 0) return fn();
  const restore = applyBalance(override);
  try {
    return fn();
  } finally {
    restore();
  }
}

/**
 * 실력 단계별 목표(첫 판, 시작 장수 셋 각각). [최소, 최대] 비율. 설계표(waveDesign)는 average를 기준으로 맞춘다.
 * dongzhuo는 동탁(18)에 닿았을 때 이길 확률. novice는 거기까지 가는 판이 적어 목표를 두지 않는다.
 */
export const SKILL_TARGETS: Record<
  'novice' | 'average' | 'expert',
  { zhangjiao: [number, number]; dongzhuo: [number, number] | null; clear: [number, number] }
> = {
  novice: { zhangjiao: [0.55, 0.75], dongzhuo: null, clear: [0, 0.02] },
  average: { zhangjiao: [0.8, 0.92], dongzhuo: [0.4, 0.6], clear: [0.03, 0.1] },
  expert: { zhangjiao: [0.9, 1], dongzhuo: [0.6, 0.8], clear: [0.15, 0.3] },
};
