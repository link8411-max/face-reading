import { getDuelGeneral, MOB_ID } from '@/lib/duel/generals';
import { WAVES } from '@/lib/duel/run';

export interface DuelFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  note: string;
  wave: number;
  starter: string;
  cleared: boolean;
  device: 'mobile' | 'desktop';
}

// 피드백 본문 검증. 알 수 없는 키는 버리고, 유효하지 않으면 null.
export function validateFeedback(body: unknown): DuelFeedback | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;

  const { rating, wave, starter, cleared, device } = b;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  if (typeof wave !== 'number' || !Number.isInteger(wave) || wave < 1 || wave > WAVES) return null;
  if (typeof starter !== 'string' || starter === MOB_ID || !getDuelGeneral(starter)) return null;
  if (typeof cleared !== 'boolean') return null;
  if (device !== 'mobile' && device !== 'desktop') return null;

  let note = '';
  if (b.note !== undefined) {
    if (typeof b.note !== 'string') return null;
    note = b.note.trim().slice(0, 200);
  }

  return { rating: rating as DuelFeedback['rating'], note, wave, starter, cleared, device };
}

// 판마다 한 번 만드는 무작위 값(영문·숫자 16자). 공유 ?seed= 링크로 같은 시드·장수·웨이브가 되어도
// 서로 다른 플레이어의 피드백이 같은 runId로 겹치지 않게 한다. 개인 정보가 아니며 저장하지 않는다.
export function newRunNonce(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

// 한 판의 식별자(영문·숫자 8자 안팎): nonce + 시드 + 시작 장수 + 웨이브 수의 FNV-1a 해시.
// 같은 판을 두 번 보내지 않게 서버가 runId로 거른다.
export function makeRunId(nonce: string, seed: number, starter: string, waves: number): string {
  let h = 0x811c9dc5;
  for (const ch of `${nonce}.${seed >>> 0}.${starter}.${waves}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}
