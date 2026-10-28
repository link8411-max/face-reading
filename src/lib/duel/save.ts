// 일기토 저장: localStorage 직렬화 (storage는 인자로 받는다 — window 접근 없음)

import { getDuelGeneral, STARTER_IDS } from './generals';
import type { Fighter, RunRecord, RunState, SaveData } from './types';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'unse-duel:v1';
const HISTORY_MAX = 20;

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** 처음 저장 값(시작 장수 3명, 기록 없음) */
export function defaultSave(): SaveData {
  return { version: 1, roster: [...STARTER_IDS], best: { wave: 0, clears: 0 }, history: [], current: null };
}

const known = (id: unknown): id is string => typeof id === 'string' && !!getDuelGeneral(id);

function sanitizeRoster(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw.filter(known) : [];
  return [...new Set<string>([...STARTER_IDS, ...list])];
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
}

function validCurrent(c: unknown): RunState | null {
  if (!c || typeof c !== 'object') return null;
  const run = c as RunState;
  if (!Array.isArray(run.party) || !Array.isArray(run.roster) || !run.record) return null;
  const bp = run.battle?.party;
  const fighters: (Fighter | null | undefined)[] = [...run.party, run.enemy, run.battle?.enemy, ...(Array.isArray(bp) ? bp : [])];
  for (const f of fighters) {
    if (f && !known(f.id)) return null;
  }
  if (!run.roster.every(known) || !known(run.record.starter)) return null;
  return run;
}

function safeCurrent(c: unknown): RunState | null {
  try {
    return validCurrent(c);
  } catch {
    return null;
  }
}

function sanitizeHistory(raw: unknown): RunRecord[] {
  if (!Array.isArray(raw)) return [];
  const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object';
  return raw
    .filter((r) => isObj(r) && Array.isArray(r.waves) && r.waves.every(isObj))
    .slice(0, HISTORY_MAX) as RunRecord[];
}

export function loadSave(storage: Store | null): SaveData {
  let parsed: unknown;
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    parsed = JSON.parse(raw);
  } catch {
    return defaultSave();
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaultSave();
  const p = parsed as Partial<SaveData> & { version?: unknown };
  const best = (p.best ?? {}) as Partial<SaveData['best']>;
  return {
    version: 1,
    roster: sanitizeRoster(p.roster),
    best: { wave: num(best.wave), clears: num(best.clears) },
    history: sanitizeHistory(p.history),
    current: p.version === SAVE_VERSION ? safeCurrent(p.current) : null,
  };
}

export function writeSave(storage: Store | null, data: SaveData): boolean {
  try {
    if (!storage) return false;
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function recordRunEnd(data: SaveData, record: RunRecord): SaveData {
  const recruited = record.waves.filter((w) => w.recruited === true).map((w) => w.enemy);
  return {
    ...data,
    roster: [...new Set([...data.roster, ...recruited, record.starter])],
    best: {
      wave: Math.max(data.best.wave, record.waves.length),
      clears: data.best.clears + (record.cleared ? 1 : 0),
    },
    history: [record, ...data.history].slice(0, HISTORY_MAX),
    current: null,
  };
}
