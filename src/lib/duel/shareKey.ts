// 일기토 공유 키: <선두>.<마지막 적>.<싸움 번호>.<c|l>.<합 수> (예 guanyu.lvbu.17.l.9)
// 영문 id·숫자·점만 담는다. 이름·보상·전체 기록은 넣지 않는다.
import { BOSS_IDS, getDuelGeneral, MOB_ID } from './generals';
import { WAVES } from './run';
import type { RunRecord } from './types';

export interface RunKey {
  starter: string;
  lastEnemy: string;
  wave: number;
  cleared: boolean;
  turns: number;
}

// 숫자는 1~99, 앞자리 0 없이(같은 판이 여러 키로 갈라지지 않게)
const KEY_RE = /^[a-z]+\.[a-z]+\.[1-9]\d?\.[cl]\.[1-9]\d?$/;
const MAX_LEN = 60;
const MAX_WAVE = WAVES;
const MAX_TURNS = 99;
/** 클리어는 마지막 웨이브에서 마지막 보스(여포)를 꺾은 판뿐이다 */
const FINAL_BOSS = BOSS_IDS[BOSS_IDS.length - 1];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n) || lo));

export function encodeRunKey(record: RunRecord): string {
  const last = record.waves[record.waves.length - 1];
  const enemy = last?.enemy ?? MOB_ID;
  const wave = clamp(last?.wave ?? 1, 1, MAX_WAVE);
  const turns = clamp(last?.turns ?? 1, 1, MAX_TURNS);
  return `${record.starter}.${enemy}.${wave}.${record.cleared ? 'c' : 'l'}.${turns}`;
}

export function decodeRunKey(key: string): RunKey | null {
  if (typeof key !== 'string' || key.length > MAX_LEN || !KEY_RE.test(key)) return null;
  const [starter, lastEnemy, w, c, t] = key.split('.');
  const lead = getDuelGeneral(starter);
  if (!lead || (lead.role !== 'starter' && lead.role !== 'recruit')) return null;
  if (!getDuelGeneral(lastEnemy)) return null;
  const wave = Number(w);
  const turns = Number(t);
  if (wave < 1 || wave > MAX_WAVE || turns < 1 || turns > MAX_TURNS) return null;
  const cleared = c === 'c';
  if (cleared && (wave !== MAX_WAVE || lastEnemy !== FINAL_BOSS)) return null;
  return { starter, lastEnemy, wave, cleared, turns };
}
