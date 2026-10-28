// 일기토 캔버스 연출: 순수 함수(포즈 트윈 + 이벤트 → 타임라인)
// 연출 모델은 충돌-교차: 한 합마다 둘이 가운데로 돌진해 부딪히고 서로 지나쳐 반대편 끝에 멈춘다.
import type { TurnEvent } from '@/lib/duel/types';

export type Side = 'left' | 'right';
export type Who = 'player' | 'enemy';

/** x는 0~1 정규화 가로 위치(스프라이트 중심), facing은 바라보는 방향(1=오른쪽) */
export interface Pose {
  x: number;
  dy: number;
  alpha: number;
  flash: number;
  scale: number;
  facing: 1 | -1;
}

export interface TimelineItem {
  /** 타임라인 시작부터 ms */
  at: number;
  dur: number;
  kind: 'pass' | 'clash' | 'cutin' | 'strike' | 'ko' | 'text';
  /** clash·strike·cutin: 공격한 쪽, ko·text: 영향을 받은 쪽 */
  who?: Who;
  amount?: number;
  text?: string;
  skillId?: string;
  /** pass 전용: 가운데에서 멈춰 있는 시간(필살기 컷인+베기) */
  hold?: number;
  /** 이 항목이 속한 합이 끝난 뒤의 자리 */
  sidesAfter: { player: Side };
}

// ── 시간 상수(ms) ──
export const PASS_MS = 700;
export const CLASH_MS = 300;
export const CUTIN_MS = 900;
export const STRIKE_MS = 400;
export const KO_MS = 600;
export const TEXT_MS = 400;

export const LEFT_X = 0.02;
export const RIGHT_X = 0.98;
const CENTER_X = 0.5;
/** 돌진 끝, 충돌 정지 끝 */
const T_MEET = 0.45;
const T_LEAVE = 0.55;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

export const otherSide = (s: Side): Side => (s === 'left' ? 'right' : 'left');
export const otherWho = (w: Who): Who => (w === 'player' ? 'enemy' : 'player');

/** 한 합의 포즈: 0~0.45 가운데로 돌진, 0.45~0.55 충돌 정지, 0.55~1 반대편 끝으로 지나쳐 멈춤 */
export function passPose(t: number, from: Side): Pose {
  t = clamp01(t);
  const start = from === 'left' ? LEFT_X : RIGHT_X;
  const end = from === 'left' ? RIGHT_X : LEFT_X;
  const facing: 1 | -1 = from === 'left' ? 1 : -1;
  let x: number;
  let flash = 0;
  let moving = true;
  if (t <= T_MEET) {
    x = start + (CENTER_X - start) * easeIn(t / T_MEET);
  } else if (t <= T_LEAVE) {
    x = CENTER_X;
    flash = 1 - (t - T_MEET) / (T_LEAVE - T_MEET);
    moving = false;
  } else {
    x = CENTER_X + (end - CENTER_X) * easeOut((t - T_LEAVE) / (1 - T_LEAVE));
  }
  // 말이 달리는 동안만 위아래로 들썩인다(최대 2px 위로)
  const dy = moving && t < 1 ? -Math.round(Math.abs(Math.sin(t * Math.PI * 8)) * 2) : 0;
  return { x, dy, alpha: 1, flash, scale: 1, facing };
}

/** 쓰러짐: scale 1→0.9, alpha 1→0, dy 0→+20. x·facing은 의미 없음(호출자가 현재 자리를 쓴다) */
export function koPose(t: number): Pose {
  t = clamp01(t);
  return { x: 0, dy: 20 * t, alpha: 1 - t, flash: 0, scale: 1 - 0.1 * t, facing: 1 };
}

/** 컷인 어둡기 비율: 앞 15% 동안 들어오고 뒤 15% 동안 빠진다 */
export function cutinAlpha(t: number): number {
  t = clamp01(t);
  if (t < 0.15) return t / 0.15;
  if (t > 0.85) return (1 - t) / 0.15;
  return 1;
}

/** 필살기: 장수별 기술 id가 _ult로 끝난다(공용 횟수 제한 기술은 아니다) */
export const isUltimate = (skillId?: string) => !!skillId && skillId.endsWith('_ult');

interface ActionGroup {
  who: Who;
  kind: 'skill' | 'switch' | 'miss';
  skillId?: string;
  /** 피해: 공격한 쪽 기준 */
  hits: { who: Who; amount: number; counter: boolean }[];
}

interface PassGroup {
  actions: ActionGroup[];
  statuses: TurnEvent[];
  kos: Who[];
}

/** 이벤트를 합 단위로 묶는다. 한 합 = 행동 둘(교체도 행동 하나로 센다) */
function groupPasses(events: TurnEvent[]): PassGroup[] {
  const passes: PassGroup[] = [];
  let cur: PassGroup | null = null;
  // 클로저 안에서 바뀌므로 상자에 담는다(흐름 분석이 null로 좁히지 않게)
  const st: { act: ActionGroup | null } = { act: null };
  const pass = () => {
    if (!cur) {
      cur = { actions: [], statuses: [], kos: [] };
      passes.push(cur);
    }
    return cur;
  };
  const startAction = (a: ActionGroup) => {
    if (cur && cur.actions.length >= 2) cur = null;
    pass().actions.push(a);
    st.act = a;
  };
  for (const e of events) {
    switch (e.kind) {
      case 'skill':
        startAction({ who: e.who, kind: 'skill', skillId: e.skillId, hits: [] });
        break;
      case 'switch':
        startAction({ who: e.who, kind: 'switch', hits: [] });
        break;
      case 'miss': {
        // 같은 쪽 기술 바로 뒤의 miss는 그 기술의 결과, 아니면(혼란) 그 자체가 행동
        const a = st.act;
        if (!a || a.who !== e.who || a.kind !== 'skill') startAction({ who: e.who, kind: 'miss', hits: [] });
        break;
      }
      case 'hit':
      case 'counter': {
        if (!st.act) startAction({ who: e.who, kind: 'skill', skillId: e.skillId, hits: [] });
        st.act!.hits.push({ who: e.who, amount: e.amount ?? 0, counter: e.kind === 'counter' });
        break;
      }
      case 'status':
        pass().statuses.push(e);
        break;
      case 'ko':
        pass().kos.push(e.who);
        break;
    }
  }
  return passes;
}

/** 한 턴(또는 여러 턴)의 이벤트를 그릴 타임라인으로 바꾼다. at은 단조 증가 */
export function eventsToTimeline(events: TurnEvent[], sides: { player: Side }): TimelineItem[] {
  const out: TimelineItem[] = [];
  let side: Side = sides.player;
  let t = 0;
  for (const g of groupPasses(events)) {
    const moves = g.actions.length > 0;
    const after = { player: moves ? otherSide(side) : side };
    if (moves) {
      const ult = g.actions.find((a) => a.kind === 'skill' && isUltimate(a.skillId));
      const hold = ult ? CUTIN_MS + STRIKE_MS : 0;
      out.push({ at: t, dur: PASS_MS + hold, kind: 'pass', ...(hold ? { hold } : {}), sidesAfter: after });
      // 보통 피해는 합의 한가운데에서 부딪힘
      const clashAt = t + PASS_MS / 2 - CLASH_MS / 2;
      for (const a of g.actions) {
        if (a === ult) continue;
        for (const h of a.hits) {
          out.push({ at: clashAt, dur: CLASH_MS, kind: 'clash', who: h.who, amount: h.amount, skillId: a.skillId, sidesAfter: after });
        }
      }
      if (ult) {
        const cutinAt = t + PASS_MS / 2;
        out.push({ at: cutinAt, dur: CUTIN_MS, kind: 'cutin', who: ult.who, skillId: ult.skillId, sidesAfter: after });
        const main = ult.hits.find((h) => !h.counter && h.who === ult.who);
        out.push({
          at: cutinAt + CUTIN_MS,
          dur: STRIKE_MS,
          kind: 'strike',
          who: ult.who,
          ...(main ? { amount: main.amount } : {}),
          skillId: ult.skillId,
          sidesAfter: after,
        });
        // 필살기를 맞고 매복 반격하면 베기 직후 부딪힘으로 보여 준다
        for (const h of ult.hits) {
          if (h === main) continue;
          out.push({ at: cutinAt + CUTIN_MS, dur: CLASH_MS, kind: 'clash', who: h.who, amount: h.amount, skillId: ult.skillId, sidesAfter: after });
        }
      }
      t += PASS_MS + hold;
    }
    for (const s of g.statuses) {
      out.push({ at: t, dur: TEXT_MS, kind: 'text', who: s.who, text: s.text, ...(s.amount ? { amount: s.amount } : {}), sidesAfter: after });
      t += TEXT_MS;
    }
    for (const who of g.kos) {
      out.push({ at: t, dur: KO_MS, kind: 'ko', who, sidesAfter: after });
      t += KO_MS;
    }
    side = after.player;
  }
  // 같은 at끼리는 넣은 순서를 지키며 정렬(안정 정렬)
  return out.map((it, i) => [it, i] as const).sort((a, b) => a[0].at - b[0].at || a[1] - b[1]).map(([it]) => it);
}

/** 타임라인 전체 길이(ms) */
export function timelineLength(tl: TimelineItem[]): number {
  return tl.reduce((m, it) => Math.max(m, it.at + it.dur), 0);
}
