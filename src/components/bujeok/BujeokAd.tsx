// 부적 아래 광고 자리. 재물 소원이고 집시세의 이번 주 신고가가 있으면 집시세 배너, 그 밖에는 쿠팡 배너(subId bujeok-<소원>).
// 부적 위·앞에는 두지 않는다(호출하는 쪽이 카드 아래에 놓는다). high는 서버가 읽어 내려 준다.
import CoupangBanner from '@/components/CoupangBanner'
import HouseBanner from './HouseBanner'
import type { Wish } from '@/lib/bujeok/keys'
import type { WeeklyHigh } from '@/lib/zipsise/banner'

export default function BujeokAd({ wish, high }: { wish: Wish; high: WeeklyHigh | null }) {
  if (wish === 'money' && high) return <HouseBanner high={high} />
  return <CoupangBanner subId={`bujeok-${wish}`} />
}
