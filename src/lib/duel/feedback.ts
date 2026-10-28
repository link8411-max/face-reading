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
