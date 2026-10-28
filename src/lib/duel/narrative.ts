// 열전(列傳): 한 판의 기록을 삼국지 열전 문체의 짧은 이야기로. AI·난수 없이 문장 틀에 기록을 끼운다.
import { josa } from '@/lib/shareLinks';
import { BOSS_IDS, getDuelGeneral, MOB_ID } from './generals';
import { REWARDS } from './rewards';
import { SKILLS } from './skills';
import type { RunRecord, RunWave } from './types';

export const ORDINALS = [
  '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째',
  '열한째', '열두째', '열셋째', '열넷째', '열다섯째', '열여섯째', '열일곱째', '열여덟째', '열아홉째', '스무째',
];

const COUNTS = ['한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const MOB_COUNTS = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

const MIN_LINES = 3;
const MAX_LINES = 8;
const MOB_NAME = '황건적';

export const ordinal = (wave: number) => ORDINALS[wave - 1] ?? `${wave}번째`;

/** 합 수 같은 관형 수사: 1~10은 한·두·세…열, 그 밖은 숫자 */
export const koreanCount = (n: number) => COUNTS[n - 1] ?? String(n);

const mobCount = (n: number) => MOB_COUNTS[n - 1] ?? `${n}명`;

const nameOf = (id: string) => (id === MOB_ID ? MOB_NAME : getDuelGeneral(id)?.name ?? id);

const skillName = (id: string | undefined): string | undefined => {
  if (!id) return undefined;
  if (id === 'burn') return '화상';
  return SKILLS[id]?.name;
};

/** 받침이 없거나 ㄹ 받침이면 '로', 그 밖은 '으로' */
const euro = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  const jong = c >= 0 && c <= 11171 ? c % 28 : 0;
  return w + (jong === 0 || jong === 8 ? '로' : '으로');
};

const iga = (w: string) => josa(w, '이', '가');
const eulreul = (w: string) => josa(w, '을', '를');
const gwawa = (w: string) => josa(w, '과', '와');

const isBoss = (id: string) => (BOSS_IDS as readonly string[]).includes(id);

type Kind = 'open' | 'mob' | 'win' | 'plain' | 'fold' | 'boss' | 'flourish' | 'recruit' | 'reward' | 'final';

interface Item {
  kind: Kind;
  text: string;
  /** plain·mob 묶음용: 이 문장이 다루는 웨이브 범위와 상대 이름 */
  from?: number;
  to?: number;
  foe?: string;
}

/** record 내용으로 틀을 고른다 (난수 없음) */
const pick = <T>(list: T[], key: number) => list[((key % list.length) + list.length) % list.length];

function mobSentence(startWave: number, n: number): string {
  const c = mobCount(n);
  return pick(
    [`${MOB_NAME}을 ${c} 베고 나아가다.`, `${MOB_NAME}을 ${c} 베고 길을 열다.`],
    startWave - 1,
  );
}

function winItems(w: RunWave, lead: string): Item[] {
  const enemy = nameOf(w.enemy);
  const by = w.finisherBy ? nameOf(w.finisherBy) : lead;
  const ord = ordinal(w.wave);
  const n = koreanCount(w.turns);
  const skill = skillName(w.finisher);
  const items: Item[] = [];

  if (w.lostAlly) {
    const ally = nameOf(w.lostAlly);
    const how = skill ? `${euro(skill)} ` : '';
    // 보스를 꺾었으면 전사가 있어도 사기 문구를 붙인다
    const end = isBoss(w.enemy) ? `${iga(by)} ${how}끝을 내니 사기가 올랐다.` : `${iga(by)} ${how}끝을 냈다.`;
    items.push({ kind: 'win', text: `${ord} 싸움, ${enemy}에게 ${iga(ally)} 쓰러졌으나 ${end}` });
  } else if (isBoss(w.enemy)) {
    const how = skill ? `${euro(skill)} ` : '';
    items.push({
      kind: 'boss',
      text: pick(
        [
          `${ord} 싸움에서 ${iga(by)} ${eulreul(enemy)} ${n} 합 만에 ${how}꺾으니 사기가 올랐다.`,
          `${ord} 싸움, ${gwawa(enemy)} 맞서 ${n} 합 만에 ${how}베니 사기가 올랐다.`,
        ],
        w.wave,
      ),
    });
  } else if (skill) {
    items.push({
      kind: 'plain',
      from: w.wave, to: w.wave, foe: enemy,
      text: pick(
        [
          `${ord} 싸움에서 ${eulreul(enemy)} ${n} 합 만에 ${euro(skill)} 꺾다.`,
          `${ord} 싸움, ${iga(by)} ${euro(skill)} ${eulreul(enemy)} ${n} 합 만에 베다.`,
          `${ord} 싸움에서 ${eulreul(enemy)} 만나 ${n} 합 만에 ${by}의 ${euro(skill)} 물리치다.`,
        ],
        w.wave,
      ),
    });
  } else {
    items.push({
      kind: 'plain',
      from: w.wave, to: w.wave, foe: enemy,
      text: pick(
        [`${ord} 싸움에서 ${iga(by)} ${eulreul(enemy)} ${n} 합 만에 꺾다.`, `${ord} 싸움, ${eulreul(enemy)} ${n} 합 만에 베다.`],
        w.wave,
      ),
    });
  }

  if (isBoss(w.enemy)) {
    items.push({
      kind: 'flourish',
      text: pick([`${iga(enemy)} 쓰러지자 적진이 흩어졌다.`, `${enemy}의 군세가 무너져 내렸다.`], w.wave),
    });
  }
  if (w.recruited) items.push({ kind: 'recruit', text: `${iga(enemy)} 항복하여 합류하다.`, foe: enemy });
  return items;
}

function finalItems(w: RunWave, lead: string, cleared: boolean): Item[] {
  const enemy = nameOf(w.enemy);
  const n = koreanCount(w.turns);
  const meet: Item = { kind: 'final', text: `${ordinal(w.wave)} 싸움, ${gwawa(enemy)} 마주하다.` };
  if (cleared) {
    const by = w.finisherBy ? nameOf(w.finisherBy) : lead;
    const skill = skillName(w.finisher);
    const how = skill ? `${euro(skill)} ` : '';
    const fell = w.lostAlly ? `${iga(nameOf(w.lostAlly))} 쓰러지는 가운데 ` : '';
    return [meet, { kind: 'final', text: `${fell}${n} 합 만에 ${iga(by)} ${how}${eulreul(enemy)} 꺾으니, 천하에 이름을 떨치다.` }];
  }
  const ally = w.lostAlly ? nameOf(w.lostAlly) : undefined;
  const end =
    ally && ally !== lead
      ? `${iga(ally)} 먼저 쓰러지고, ${n} 합 끝에 ${lead}도 쓰러지니, 여기서 행군이 끝나다.`
      : `${n} 합 끝에 ${iga(lead)} 쓰러지니, 여기서 행군이 끝나다.`;
  return [meet, { kind: 'final', text: end }];
}

/** 이름이 조사와 맞지 않는 보상은 문장을 따로 둔다 ("동행 자리 +1", "병법서: 화공") */
const REWARD_LINES: Record<string, string> = {
  slot: '도중에 동행 자리를 하나 더 얻었다.',
  book_fire: '도중에 화공의 병법서를 얻었다.',
};

function rareRewardItem(rewards: string[]): Item | undefined {
  for (const id of rewards) {
    const r = REWARDS.find((x) => x.id === id);
    if (r && r.rarity === 'rare') return { kind: 'reward', text: REWARD_LINES[r.id] ?? `도중에 ${eulreul(r.name)} 얻었다.` };
  }
  return undefined;
}

/** 'A다.' + 'B다.' → 'A(으)니, B다.' (항복 문장을 앞 승리 문장에 잇는다) */
function joinNi(a: string, b: string): string {
  if (!a.endsWith('다.')) return `${a} ${b}`;
  const stem = a.slice(0, -2);
  const c = stem.charCodeAt(stem.length - 1) - 0xac00;
  const batchim = c >= 0 && c <= 11171 && c % 28 !== 0;
  return `${stem}${batchim ? '으니' : '니'}, ${b}`;
}

/** 'A, B, C' 또는 'A와 B' (마지막 이름에 조사를 붙여 넘긴다) */
const listNames = (names: string[], last: string) =>
  names.length === 1 ? last : names.length === 2 ? `${gwawa(names[0])} ${last}` : [...names.slice(0, -1), last].join(', ');

const foldable = (it: Item) => it.kind === 'plain' || it.kind === 'mob';

/** 첫 문장을 뺀, 이어지는 plain·졸개 승리들을 "…부터 … 싸움까지 A, B를 차례로 꺾다"로 */
function foldWins(items: Item[]): Item[] {
  const out: Item[] = [];
  let i = 0;
  while (i < items.length) {
    if (i === 0 || !foldable(items[i])) {
      out.push(items[i++]);
      continue;
    }
    let j = i;
    while (j < items.length && foldable(items[j])) j++;
    const run = items.slice(i, j);
    if (run.length < 2 || !run.some((it) => it.kind === 'plain')) out.push(...run);
    else {
      const names = run.map((it) => it.foe!);
      const from = run[0].from!;
      const to = run[run.length - 1].to!;
      const span = to === from + 1 ? `${ordinal(from)}와 ${ordinal(to)} 싸움에서` : `${ordinal(from)}부터 ${ordinal(to)} 싸움까지`;
      out.push({ kind: 'fold', text: `${span} ${listNames(names, eulreul(names[names.length - 1]))} 차례로 꺾다.` });
    }
    i = j;
  }
  return out;
}

/**
 * 항복이 하나면 바로 앞 승리 문장에 잇고(그 문장은 영입 문장이 되어 빠지지 않는다),
 * 여럿이면 마지막 항복 자리에 "그사이 A, B가 차례로 항복하여 합류하다." 한 문장으로.
 */
function mergeRecruits(items: Item[]): Item[] {
  const recruits = items.filter((it) => it.kind === 'recruit');
  if (recruits.length === 0) return items;
  if (recruits.length === 1) {
    const out: Item[] = [];
    for (const it of items) {
      const prev = out[out.length - 1];
      if (it.kind === 'recruit' && prev && prev.kind !== 'open') out[out.length - 1] = { kind: 'recruit', text: joinNi(prev.text, it.text) };
      else out.push(it);
    }
    return out;
  }
  const names = [...new Set(recruits.map((it) => it.foe!))];
  const text = `그사이 ${listNames(names, iga(names[names.length - 1]))} 차례로 항복하여 합류하다.`;
  const lastAt = items.lastIndexOf(recruits[recruits.length - 1]);
  return items.flatMap((it, i) => (i === lastAt ? [{ kind: 'recruit' as Kind, text }] : it.kind === 'recruit' ? [] : [it]));
}

/** 첫 문장과 마지막 싸움 두 문장을 빼고, kinds에 드는 문장을 앞에서부터 하나씩 뺀다 */
const dropEarliest = (kinds: Kind[] | null) => (xs: Item[]): Item[] => {
  const out = [...xs];
  for (let i = 1; i < out.length - 2 && out.length > MAX_LINES; ) {
    if (kinds === null || kinds.includes(out[i].kind)) out.splice(i, 1);
    else i++;
  }
  return out;
};

/**
 * 8문장을 넘으면 차례로: 보상 → 보스 여운 문장을 빼고, 이어진 승리를 묶고, 항복을 잇거나 모으고,
 * 그래도 많으면 덜 중요한 문장(졸개 → 묶은·평범한 승리 → 전사 있는 승리 → 그 밖)을 앞에서부터 뺀다.
 * 문장을 억지로 이어 붙이지 않는다.
 */
function fit(items: Item[]): Item[] {
  let out = items;
  const steps: ((xs: Item[]) => Item[])[] = [
    (xs) => xs.filter((it) => it.kind !== 'reward'),
    (xs) => xs.filter((it) => it.kind !== 'flourish'),
    foldWins,
    mergeRecruits,
    dropEarliest(['mob']),
    dropEarliest(['fold', 'plain']),
    dropEarliest(['win']),
    dropEarliest(null),
  ];
  for (const step of steps) {
    if (out.length <= MAX_LINES) return out;
    out = step(out);
  }
  return out;
}

export function narrate(record: RunRecord): { title: string; lines: string[]; headline: string } {
  const lead = nameOf(record.starter);
  const title = `${lead} 열전`;
  const opening: Item = { kind: 'open', text: `${lead}, 홀로 말을 달려 출진하다.` };
  const waves = record.waves;
  const last = waves[waves.length - 1];

  if (!last) {
    return {
      title,
      headline: `${lead}, 출진을 앞두다`,
      lines: [opening.text, '아직 맞선 적이 없다.', '행군은 이제 막 시작되려 한다.'],
    };
  }

  const enemy = nameOf(last.enemy);
  const headline = record.cleared
    ? `${lead}, ${ordinal(last.wave)} 싸움에서 ${eulreul(enemy)} 꺾고 천하에 이름을 떨치다`
    : `${lead}, ${ordinal(last.wave)} 싸움에서 ${enemy}에게 ${koreanCount(last.turns)} 합 끝에 쓰러지다`;

  const items: Item[] = [];
  const wins = waves.slice(0, -1);
  let i = 0;
  while (i < wins.length) {
    const w = wins[i];
    if (w.enemy === MOB_ID && !w.lostAlly && !w.recruited) {
      let j = i;
      while (j < wins.length && wins[j].enemy === MOB_ID && !wins[j].lostAlly && !wins[j].recruited) j++;
      items.push({ kind: 'mob', text: mobSentence(w.wave, j - i), from: w.wave, to: wins[j - 1].wave, foe: `${MOB_NAME} 무리` });
      i = j;
      continue;
    }
    items.push(...winItems(w, lead));
    i++;
  }
  const reward = rareRewardItem(record.rewards);
  if (reward) items.push(reward);
  items.push(...finalItems(last, lead, record.cleared));

  let fitted = fit(items);
  if (fitted.length < MIN_LINES) fitted = [opening, ...fitted];
  const lines = fitted.map((it) => it.text);
  // 첫 문장에 선두가 없으면 "<선두>, "를 붙인다. "<서수> 싸움, "은 쉼표가 겹치지 않게 "<서수> 싸움에서 "로
  if (!lines[0].includes(lead)) lines[0] = `${lead}, ${lines[0].replace(/^(\S+) 싸움, /, '$1 싸움에서 ')}`;
  return { title, lines, headline };
}
