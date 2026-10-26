// 각 테스트 페이지 아래에 서버 렌더되는 설명 본문 (검색엔진·애드센스 심사용)
// 페이지 위젯은 "use client"라 서버 HTML에 글이 거의 없으므로, 여기 본문이 색인의 주 대상이 된다.

export type GuideRoute = '/face2' | '/animal' | '/samguk' | '/fortune' | '/fortune/daily'

export interface PageGuideData {
  heading: string
  intro: string[]
  howTo: string[]
  highlights: { title: string; body: string }[]
  faqs: { q: string; a: string }[]
  related: GuideRoute[]
}

export const TEST_LINKS: Record<GuideRoute, { label: string; emoji: string }> = {
  '/face2': { label: 'AI 관상 테스트', emoji: '👤' },
  '/animal': { label: '동물상 테스트', emoji: '🦊' },
  '/samguk': { label: '삼국지 닮은꼴', emoji: '⚔️' },
  '/fortune': { label: '사주 신년운세', emoji: '🔮' },
  '/fortune/daily': { label: '띠별 오늘의 운세', emoji: '☯' },
}

export const pageGuides: Partial<Record<GuideRoute, PageGuideData>> = {
  '/face2': {
    heading: '무료 AI 관상 테스트, 이렇게 봐요',
    intro: [
      '관상은 얼굴의 생김새로 사람의 성격과 운의 흐름을 읽는 동양의 전통 학문이에요. 예로부터 이마는 초년, 코와 광대는 중년, 입과 턱은 말년을 나타낸다고 보았고, 눈은 마음이 드러나는 창으로 여겨 가장 중요하게 다뤘어요.',
      '운명을 읽다의 AI 관상 테스트는 사진 한 장에서 얼굴의 68개 기준점을 찾아 눈의 크기와 눈꼬리 방향, 코의 길이와 콧볼, 입의 크기와 입꼬리, 이마와 턱의 비율, 전체 얼굴형을 측정해요. 측정한 특징을 전통 관상학의 해석과 짝지어 초년운·중년운·말년운과 재물운, 애정운, 직장운, 건강운, 대인운을 알려드려요.',
      '분석은 모두 사용 중인 브라우저 안에서 이뤄지고, 사진은 서버로 전송되거나 저장되지 않아요. 횟수 제한 없이 무료로 여러 번 해볼 수 있으니 가족이나 친구 사진으로도 재미 삼아 비교해 보세요.',
    ],
    howTo: [
      '정면을 바라보고 이마부터 턱까지 잘 보이는 사진을 골라요. 앞머리나 안경, 마스크가 얼굴을 가리면 정확도가 떨어져요.',
      '사진을 올리면 브라우저가 얼굴 기준점을 찾아 이목구비의 비율을 계산해요.',
      '눈·코·입·얼굴형·이마·턱별 해석과 인생 시기별 운세, 5가지 분야별 운 점수를 확인해요.',
      '결과 화면을 이미지로 저장해 친구와 나눠 보세요.',
    ],
    highlights: [
      { title: '이목구비별 풀이', body: '눈은 마음과 지혜, 코는 재물과 자존심, 입은 말과 애정, 이마는 초년의 복, 턱은 말년의 안정과 관련 있다고 봐요. 각 부위의 생김새에 따라 다른 해석을 보여드려요.' },
      { title: '초년·중년·말년운', body: '얼굴을 위·가운데·아래 세 부분(삼정)으로 나눠 인생의 시기별 흐름을 점수와 함께 풀이해요.' },
      { title: '분야별 운 점수', body: '재물운, 애정운, 직장운, 건강운, 대인운을 각각 점수로 보여주고, 타고난 성격의 장점과 조심하면 좋은 점도 함께 알려드려요.' },
    ],
    faqs: [
      { q: '사진이 저장되나요?', a: '아니요. 얼굴 분석은 사용 중인 브라우저 안에서만 이뤄지고, 사진은 서버로 전송되거나 저장되지 않아요. 페이지를 닫으면 사진 정보도 사라져요.' },
      { q: '정말 무료인가요? 횟수 제한이 있나요?', a: '완전히 무료이고 횟수 제한도 없어요. 회원가입이나 로그인도 필요하지 않아요.' },
      { q: '어떤 사진이 좋나요?', a: '정면을 보고 찍은 밝은 사진이 가장 좋아요. 고개를 많이 돌렸거나 얼굴 일부가 가려지면 기준점을 정확히 찾기 어려워 결과가 달라질 수 있어요.' },
      { q: '같은 사람인데 사진마다 결과가 달라요.', a: '표정, 각도, 조명에 따라 이목구비의 비율이 조금씩 다르게 측정돼요. 무표정한 정면 사진으로 하면 가장 일관된 결과를 볼 수 있어요.' },
      { q: '관상 결과를 믿어도 되나요?', a: '관상은 전통적으로 전해 오는 해석이고 과학적으로 검증된 것은 아니에요. 나를 돌아보는 재미있는 계기로 가볍게 즐겨 주세요.' },
    ],
    related: ['/animal', '/samguk', '/fortune'],
  },
}

export function faqJsonLd(route: GuideRoute): string {
  const guide = pageGuides[route]
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (guide?.faqs ?? []).map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
  // </script> 등으로 스크립트 태그가 깨지지 않게 < 를 이스케이프
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
