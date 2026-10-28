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
  /** 치명타 확률 = critBase (+ critKiBonus 기장) + 속도 보너스(명마) × critPerSpeed, 보스가 치면 × bossCritFactor. 방어 태세인 상대에겐 0 */
  critBase: number;
  critKiBonus: number;
  critPerSpeed: number;
  bossCritFactor: number;
  /** 치명타 피해 배수 */
  critMult: number;

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
  skills: Record<string, { power?: number; uses?: number | null; burnTurns?: number }>;
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
  matchWin: 1.4,
  matchLose: 0.75,
  stab: 1.2,
  healRate: 0.3,
  burnRate: 0.05,
  critBase: 0.06,
  critKiBonus: 0.06,
  critPerSpeed: 0.002,
  bossCritFactor: 0.5,
  critMult: 1.5,

  // 2라운드: 보통 웨이브 5~7합 / 13~8합(뒤로 갈수록 7/8 쪽), 보스 11~14 / 7~10.
  // 1~5는 혼자 싸우고 회복이 회복약뿐이라 쓰러지는 합을 넉넉히, 장각(6)은 혼자 맞는 상성 천적(맹장 시작)이라 8/26.
  // prettier-ignore
  waveDesign: [
    d(4, 21), d(4, 21), d(4, 21), d(5, 18), d(5, 18), d(7, 26), // 1~6 장각
    d(5, 13), d(5, 13), d(5, 13), d(5, 13), d(5, 13), d(11, 10), // 7~12 하후돈
    d(6, 11), d(6, 11), d(6, 11), d(6, 11), d(6, 11), d(13, 10), // 13~18 동탁
    d(7, 9), d(7, 9), d(7, 9), d(7, 9), d(7, 9), d(13, 9), // 19~24 황충
    d(7, 9), d(7, 9), d(7, 9), d(7, 9), d(7, 9), d(14, 7), // 25~30 마초
    d(7, 8), d(7, 8), d(7, 8), d(7, 8), d(7, 8), d(14, 8), // 31~36 여포
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
    // 주유 적벽 화계: 화상은 maxHp 비율이라 상성을 무시한다. 3턴이면 필살기 3회로 보스 체력 45%라
    // 상성 천적(24 황충·30 마초, 쓰러뜨리는 합 25~27)도 화상으로 넘었다. 2턴으로(2라운드 보정)
    zhouyu_ult: { burnTurns: 1 },
  },
  speedAdj: {},
  generalPower: { zhouyu: 0.6 },
  generalHp: { zhangfei: 1.3, zhaoyun: 1.05, zhouyu: 0.9 },
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

/** [최소, 최대] 비율 */
export type Range = [number, number];

/**
 * 밸런스 2라운드 목표(첫 판, 시작 장수 넷 각각). 설계표(waveDesign)는 average를 기준으로 맞춘다.
 * survive: 그 웨이브까지 이긴 판 비율. worstBossShare: 전체 패배 중 한 보스에게 진 비율의 최댓값.
 * normalHpLoss: 보통 웨이브 싸움에서 나선 장수가 잃는 체력 비율의 평균. novice·expert는 참고용(클리어만).
 */
export const DIST_TARGETS = {
  average: {
    diedBeforeFirstBoss: [0, 0.1] as Range,
    survive: { 12: [0.65, 0.85], 18: [0.4, 0.6], 24: [0.22, 0.38] } as Record<number, Range>,
    clear: [0.08, 0.15] as Range,
    worstBossShare: [0, 0.25] as Range,
    normalHpLoss: [0.25, 0.4] as Range,
    /** 시작 장수 클리어율 최대 − 최소 */
    starterClearSpread: 0.1,
  },
  novice: { clear: [0, 0.03] as Range },
  expert: { clear: [0.2, 0.4] as Range },
};
