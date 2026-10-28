// 삼국지 닮은꼴 결과 → 일기토로 가는 단추. 결과 장수가 일기토 시작·영입 장수일 때만 ?me=로 잠금 해제한다
// from=samguk: 영입 장수는 닮은꼴 결과에서 왔을 때만 장수록에 더한다(clientLogic.resolveStarterUnlock)
import { getDuelGeneral } from './generals';

export function duelCta(characterId: string): { label: string; href: string } {
  const g = getDuelGeneral(characterId);
  if (g && (g.role === 'starter' || g.role === 'recruit')) {
    return { label: '이 장수로 일기토 하기', href: `/samguk/duel?me=${encodeURIComponent(characterId)}&from=samguk` };
  }
  return { label: '삼국지 일기토 하러 가기', href: '/samguk/duel' };
}
