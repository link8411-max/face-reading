// 효험을 단정하는 표현. 부적 문구·광고 문구에 나오면 테스트가 실패한다.
export const BANNED_PHRASES = ['반드시', '100%', '보장', '틀림없이', '들어옵니다', '합격합니다', '들어온다'] as const

// 실제 한자 문구를 풀어 쓴 뜻풀이(hanjaMeaning)에서만 허용하는 금지어. 招財進寶의 번역 "보배가 들어온다"가 그렇다
export const EXEMPT_IN_HANJA_MEANING: readonly (typeof BANNED_PHRASES)[number][] = ['들어온다']
