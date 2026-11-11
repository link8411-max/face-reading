// 사이트 메뉴(하단 탭)와 묶음별 항목 — 홈, 허브 페이지, 하단 탭바, 푸터가 모두 이 데이터를 쓴다.
import type { IconName } from '@/components/icons'

export type TabKey = 'home' | 'face' | 'unse' | 'bujeok' | 'mbti'

export const TABS: { key: TabKey; label: string; href: string; icon: IconName }[] = [
  { key: 'home', label: '홈', href: '/', icon: 'home' },
  { key: 'face', label: '관상', href: '/face-tests', icon: 'face' },
  { key: 'unse', label: '사주·운세', href: '/unse', icon: 'moon' },
  { key: 'bujeok', label: '부적', href: '/bujeok', icon: 'spark' },
  { key: 'mbti', label: '궁합', href: '/mbti', icon: 'rings' },
]

export interface CategoryItem {
  title: string
  desc: string
  href: string
  thumb: { image?: string; icon?: IconName; bg?: string }
  chip?: string
  group?: string // 묶음 안 소제목 (연속된 같은 group 앞에 한 번 그린다)
  footer?: false // false면 푸터 목록에서 뺀다(허브·홈 탭에는 그대로)
}

export interface Category {
  key: Exclude<TabKey, 'home' | 'bujeok'>
  title: string
  tabLabel: string
  href: string
  intro: string
  items: CategoryItem[]
}

// 순서가 곧 노출 순서다(허브·홈 묶음 탭·푸터). 설계: docs/superpowers/specs/2026-11-07-site-revamp-design.md 2절
export const CATEGORIES: Category[] = [
  {
    key: 'face',
    title: '관상·얼굴 테스트',
    tabLabel: '관상',
    href: '/face-tests',
    intro: '사진 한 장으로 읽는 15가지 관상이에요. 오행 얼굴형과 삼정으로 풀이하고, 닮은 동물상과 삼국지 영웅도 찾아 드려요. 사진은 브라우저 안에서만 분석되고 서버로 전송되지 않아요.',
    items: [
      { group: '관상·동물상', title: '내 관상 풀이', desc: '오행 얼굴형과 삼정으로 읽는 15가지 관상', href: '/face2', thumb: { icon: 'face', bg: '#F1EBE2' }, chip: '15가지 유형' },
      { group: '관상·동물상', title: '동물상 테스트', desc: '강아지상? 고양이상? 8가지 중 하나', href: '/animal', thumb: { icon: 'cat', bg: '#F3EBDD' }, chip: '친구랑 비교' },
      { group: '삼국지로 보는 얼굴', title: '나는 삼국지 속 누구?', desc: '111명 영웅 중 닮은 장수와 회사생활 스탯', href: '/samguk', thumb: { image: '/images/samguk/관우.jpg' }, chip: '111명 영웅' },
      { group: '삼국지로 보는 얼굴', title: '우리 팀 삼국지', desc: '팀원 얼굴로 보는 세력과 역할', href: '/samguk/team', thumb: { icon: 'users', bg: '#E8EEE6' }, chip: '2~6명', footer: false },
      { group: '삼국지로 보는 얼굴', title: '삼국지 장수 월드컵', desc: '이야기를 읽고 고르는 장수 토너먼트', href: '/samguk/cup', thumb: { image: '/images/samguk/관우.jpg' }, chip: '월드컵', footer: false },
      { group: '삼국지로 보는 얼굴', title: '삼국지 인물열전', desc: '관계도·응원 순위와 장수별 열전', href: '/samguk/people', thumb: { image: '/images/samguk/제갈량.jpg' }, chip: '관계도' },
      { group: '삼국지로 보는 얼굴', title: '삼국지 이야기 영상', desc: '장수 이야기를 1분 영상으로', href: '/samguk/videos', thumb: { image: '/images/samguk/조운.jpg' }, chip: '1분 영상', footer: false },
      { group: '삼국지로 보는 얼굴', title: '삼국지 일기토', desc: '관우·여포와 벌이는 로그라이크 일기토', href: '/samguk/duel', thumb: { image: '/images/samguk/여포.jpg' }, chip: '미니게임', footer: false },
    ],
  },
  {
    key: 'unse',
    title: '사주·운세',
    tabLabel: '사주·운세',
    href: '/unse',
    intro: '내 사주 풀이와 2027 신년운세, 띠별 운세, 날마다 바뀌는 오늘의 운세를 모았어요. 생년월일 없이 MBTI만 고르면 보는 오늘의 MBTI 운세도 있어요. 음력 생일도 양력으로 바꿔 계산하고, 띠는 입춘을 기준으로 봐요.',
    items: [
      { group: '생년월일로 보는 운세', title: '내 사주 풀이', desc: '타고난 성향과 10년 흐름, 2027년까지 쉬운 말로', href: '/saju', thumb: { icon: 'moon', bg: '#EFE8DC' }, chip: '근거 함께 보기' },
      { group: '생년월일로 보는 운세', title: '2027 신년운세', desc: '내 사주로 보는 정미년 한 해', href: '/fortune', thumb: { icon: 'moon', bg: '#F1EBE2' }, chip: '월별 흐름' },
      { group: '생년월일로 보는 운세', title: '2027 띠별 운세', desc: '쥐띠부터 돼지띠까지 12띠', href: '/fortune/2027', thumb: { icon: 'spark', bg: '#F3EBDD' }, chip: '12띠' },
      { group: '생년월일로 보는 운세', title: '오늘의 운세', desc: '띠별 운세와 행운의 시간·색', href: '/fortune/daily', thumb: { icon: 'sun', bg: '#E8EEE6' }, chip: '매일' },
      { group: 'MBTI로 보는 운세', title: '오늘의 MBTI 운세', desc: 'MBTI만 고르면 오늘의 한마디와 행운', href: '/fortune/mbti', thumb: { icon: 'spark', bg: '#ECE6F0' }, chip: '생년월일 없이' },
      { group: '소원을 담은 부적', title: '나만의 부적', desc: '손으로 돌려 보는 부적 카드, 잠금화면에 저장', href: '/bujeok', thumb: { icon: 'spark', bg: '#EFE6CF' }, chip: '친구에게 선물' },
    ],
  },
  {
    key: 'mbti',
    title: '궁합·MBTI',
    tabLabel: '궁합',
    href: '/mbti',
    intro: '두 얼굴로 보는 친구·연인·짝사랑 얼굴 궁합과 MBTI 궁합을 모았어요. MBTI 16유형별 성격·연애 스타일·여행지·직업과 이달의 운세도 확인해 보세요.',
    items: [
      { title: '얼굴 궁합', desc: '두 얼굴로 보는 친구·연인·짝사랑 궁합', href: '/face-match', thumb: { icon: 'heart', bg: '#F1EBE2' }, chip: '짝사랑도' },
      { title: 'MBTI 궁합 계산기', desc: '두 유형의 연애·친구·직장 궁합 점수', href: '/mbti/match', thumb: { icon: 'rings', bg: '#E6E8DF' }, chip: '결과 저장·공유' },
      { title: 'MBTI 유형별 풀이', desc: '궁합·연애·여행지·직업·이달의 운세', href: '/mbti', thumb: { icon: 'users', bg: '#E8EEE6' }, chip: '16유형' },
    ],
  },
]

// 푸터에만 놓는 링크: 묶음(홈 탭·허브)과 하단 탭 순서는 건드리지 않는다. 홈에서는 '친구랑 같이 해봐요' 카드가 맡는다.
export const FOOTER_EXTRA: { title: string; href: string }[] = [{ title: '밈 능력고사', href: '/exam/meme' }]

// 결과 화면 아래 "이어서 보면 좋아요": 같은 줄기 1개 + 다른 줄기 1개 (설계 4절).
// samePhoto: 같은 사진으로 이어지는 칸 — 사진 결과에서는 NextTests(사진 넘기기)가 이미 보여 주므로 NextSteps는 뺀다.
export type NextFrom = 'saju' | 'fortune' | 'zodiac' | 'daily' | 'face' | 'animal' | 'samguk' | 'mbti'
export type NextTestName = 'saju' | 'fortune' | 'face' | 'animal' | 'face_match' | 'mbti_daily' | 'bujeok' | 'exam'
export interface NextStep { href: string; title: string; desc: string; test: NextTestName; icon: IconName; samePhoto?: true }

const STEP = {
  saju: { href: '/saju', title: '내 사주 풀이', desc: '타고난 성향과 10년 흐름을 쉬운 말로', test: 'saju', icon: 'moon' },
  fortune: { href: '/fortune', title: '2027 신년운세', desc: '내 사주로 보는 정미년 한 해', test: 'fortune', icon: 'spark' },
  face: { href: '/face2', title: '내 관상 풀이', desc: '사진 한 장으로 읽는 15가지 관상', test: 'face', icon: 'face' },
  animal: { href: '/animal', title: '동물상 테스트', desc: '같은 사진으로 보는 8가지 동물상', test: 'animal', icon: 'cat', samePhoto: true },
  faceSame: { href: '/face2', title: '내 관상 풀이', desc: '같은 사진으로 읽는 15가지 관상', test: 'face', icon: 'face', samePhoto: true },
  faceMatch: { href: '/face-match', title: '얼굴 궁합', desc: '친구·연인과 두 얼굴로 보는 궁합', test: 'face_match', icon: 'heart' },
  bujeok: { href: '/bujeok', title: '내 사주로 부적 만들기', desc: '부족한 기운을 채워 주는 부적, 잠금화면에 쏙', test: 'bujeok', icon: 'spark' },
  mbtiDaily: { href: '/fortune/mbti', title: '오늘의 MBTI 운세', desc: 'MBTI만 고르면 오늘의 한마디', test: 'mbti_daily', icon: 'spark' },
} as const satisfies Record<string, NextStep>

export const NEXT_BY_TEST: Record<NextFrom, [NextStep, NextStep]> = {
  saju: [STEP.bujeok, STEP.face],
  fortune: [STEP.bujeok, STEP.face],
  zodiac: [STEP.fortune, STEP.saju],
  daily: [STEP.saju, STEP.face],
  face: [STEP.animal, STEP.saju],
  animal: [STEP.faceSame, STEP.faceMatch],
  samguk: [STEP.faceSame, STEP.saju],
  mbti: [STEP.mbtiDaily, STEP.saju],
}

// 모든 "이어서 보면 좋아요" 아래에 한 줄로 붙는 매일 5문제 칸(2026-11-11, 이미 오는 검색 방문자를 시험으로 잇는다).
// 줄기 규칙(같은 줄기 1 + 다른 줄기 1)과 별개라 NEXT_BY_TEST에 넣지 않는다.
export const DAILY_EXAM_STEP: NextStep = { href: '/exam/meme', title: '오늘의 밈 능력고사', desc: '매일 자정에 열리는 5문제, 내 등급은?', test: 'exam', icon: 'spark' }

export function tabForPath(pathname: string): TabKey {
  if (pathname.startsWith('/bujeok')) return 'bujeok'
  if (pathname === '/face-tests' || ['/face2', '/animal', '/samguk'].some((p) => pathname.startsWith(p))) return 'face'
  if (pathname === '/unse' || pathname.startsWith('/fortune') || pathname.startsWith('/saju')) return 'unse'
  if (pathname.startsWith('/mbti') || pathname.startsWith('/face-match')) return 'mbti'
  return 'home'
}
