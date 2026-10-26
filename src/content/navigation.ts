// 사이트 메뉴(하단 탭)와 묶음별 항목 — 홈, 허브 페이지, 하단 탭바, 푸터가 모두 이 데이터를 쓴다.
import type { IconName } from '@/components/icons'

export type TabKey = 'home' | 'face' | 'unse' | 'mbti'

export const TABS: { key: TabKey; label: string; href: string; icon: IconName }[] = [
  { key: 'home', label: '홈', href: '/', icon: 'home' },
  { key: 'face', label: '얼굴', href: '/face-tests', icon: 'face' },
  { key: 'unse', label: '운세', href: '/unse', icon: 'moon' },
  { key: 'mbti', label: '궁합', href: '/mbti', icon: 'rings' },
]

export interface CategoryItem {
  title: string
  desc: string
  href: string
  thumb: { image?: string; icon?: IconName; bg?: string }
  chip?: string
}

export interface Category {
  key: Exclude<TabKey, 'home'>
  title: string
  tabLabel: string
  href: string
  intro: string
  items: CategoryItem[]
}

export const CATEGORIES: Category[] = [
  {
    key: 'face',
    title: '얼굴 테스트',
    tabLabel: '얼굴 테스트',
    href: '/face-tests',
    intro: '사진 한 장으로 해 보는 얼굴 테스트예요. 얼굴의 기준점을 측정해 관상을 풀이하고, 닮은 동물상과 삼국지 영웅을 찾아 드려요. 사진은 브라우저 안에서만 분석되고 서버로 전송되지 않아요.',
    items: [
      { title: '나는 삼국지 속 누구?', desc: '52명 영웅 중 닮은 장수와 회사생활 스탯', href: '/samguk', thumb: { image: '/images/samguk/관우.jpg' }, chip: '52명 영웅' },
      { title: '동물상 테스트', desc: '강아지상? 고양이상? 8가지 중 하나', href: '/animal', thumb: { icon: 'cat', bg: '#F3EBDD' }, chip: '친구랑 비교' },
      { title: 'AI 관상 테스트', desc: '초년·중년·말년운과 재물운', href: '/face2', thumb: { icon: 'face', bg: '#F1EBE2' }, chip: '무제한 무료' },
    ],
  },
  {
    key: 'unse',
    title: '운세·사주',
    tabLabel: '운세·사주',
    href: '/unse',
    intro: '생년월일로 보는 사주 신년운세와 띠별 운세, 요일마다 바뀌는 오늘의 운세를 모았어요. 음력 생일도 양력으로 바꿔 계산하고, 띠는 입춘을 기준으로 봐요.',
    items: [
      { title: '2027 신년운세', desc: '사주로 보는 정미년 한 해', href: '/fortune', thumb: { icon: 'moon', bg: '#F1EBE2' }, chip: '음력 지원' },
      { title: '2027 띠별 운세', desc: '쥐띠부터 돼지띠까지 12띠', href: '/fortune/2027', thumb: { icon: 'spark', bg: '#F3EBDD' }, chip: '12띠' },
      { title: '오늘의 운세', desc: '띠별 운세와 행운의 시간·색', href: '/fortune/daily', thumb: { icon: 'sun', bg: '#E8EEE6' }, chip: '요일별' },
    ],
  },
  {
    key: 'mbti',
    title: 'MBTI',
    tabLabel: 'MBTI',
    href: '/mbti',
    intro: 'MBTI 16유형별 성격과 잘 맞는 궁합, 연애 스타일, 여행지와 직업, 이달의 운세를 모았어요. 궁합 계산기로 두 유형의 궁합 점수도 확인해 보세요.',
    items: [
      { title: 'MBTI 궁합 계산기', desc: '두 유형의 연애·친구·직장 궁합 점수', href: '/mbti/match', thumb: { icon: 'rings', bg: '#E6E8DF' }, chip: '결과 저장·공유' },
      { title: 'MBTI 16유형 풀이', desc: '궁합·연애·여행지·직업·이달의 운세', href: '/mbti', thumb: { icon: 'users', bg: '#E8EEE6' }, chip: '16유형' },
    ],
  },
]

export function tabForPath(pathname: string): TabKey {
  if (pathname === '/face-tests' || ['/face2', '/animal', '/samguk'].some((p) => pathname.startsWith(p))) return 'face'
  if (pathname === '/unse' || pathname.startsWith('/fortune')) return 'unse'
  if (pathname.startsWith('/mbti')) return 'mbti'
  return 'home'
}
