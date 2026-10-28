// 일기토 공유 링크·미리보기. 착지 페이지·미리보기 이미지·게임 화면만 쓴다
// (shareLinks에 두면 다른 테스트 페이지마다 일기토 규칙 전체가 따라 실린다)
import { SITE, UTM } from '@/lib/shareBase';
import { getDuelGeneral } from './generals';
import { narrate } from './narrative';
import { decodeRunKey, encodeRunKey } from './shareKey';
import type { RunRecord } from './types';

// 링크에는 공유 키(선두·마지막 적·싸움 번호·클리어·합 수)와 utm만 담는다
export function duelShareUrl(record: RunRecord): string {
  return `${SITE}/samguk/duel/r/${encodeRunKey(record)}?${UTM('duel')}`;
}

/** 미리보기 이미지 주소 (/api/og/result?kind=duel&key=…) */
export function duelOgImageUrl(key: string): string {
  return `${SITE}/api/og/result?kind=duel&key=${encodeURIComponent(key)}`;
}

export function duelShared(key: string): { headline: string; starterName: string; image: string } | null {
  const k = decodeRunKey(key);
  if (!k) return null;
  const starterName = getDuelGeneral(k.starter)!.name;
  // 열전 headline은 마지막 싸움만 보므로 그 한 판만 담은 최소 기록으로 만든다
  const { headline } = narrate({
    starter: k.starter,
    waves: [{ wave: k.wave, enemy: k.lastEnemy, turns: k.turns }],
    rewards: [],
    cleared: k.cleared,
  });
  return { headline, starterName, image: `/images/samguk/${starterName}.jpg` };
}
