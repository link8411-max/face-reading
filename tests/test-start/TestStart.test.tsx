import { renderToStaticMarkup } from 'react-dom/server'
import GenderPills from '@/components/test/GenderPills'
import TestStart, { analyzeButtonLabel } from '@/components/test/TestStart'

const base = {
  heading: '웃는 사진 한 장이면 충분해요', desc: '설명', tips: ['밝은 곳에서'], analyzeLabel: '관상 보기',
  image: null, gender: null, onGender: () => {}, onFile: () => {}, onAnalyze: () => {}, onReset: () => {}, loading: false, error: null,
} as const

test('성별 pill은 라디오 그룹, 고른 값만 aria-checked', () => {
  const html = renderToStaticMarkup(<GenderPills value="여" onChange={() => {}} />)
  expect(html).toContain('role="radiogroup"')
  expect(html.match(/role="radio"/g)).toHaveLength(2)
  expect(html).toMatch(/aria-checked="true"[^>]*>여자/)
  expect(html).toMatch(/aria-checked="false"[^>]*>남자/)
})

test('분석 버튼 문구: 사진 → 성별 → 준비 중 → 분석 중 순서로 막는다', () => {
  expect(analyzeButtonLabel({ hasImage: false, gender: '여', loading: false, preparing: false, label: '관상 보기' })).toBe('사진을 먼저 골라 주세요')
  expect(analyzeButtonLabel({ hasImage: true, gender: null, loading: false, preparing: false, label: '관상 보기' })).toBe('성별을 먼저 골라 주세요')
  expect(analyzeButtonLabel({ hasImage: true, gender: '남', loading: false, preparing: true, label: '관상 보기' })).toBe('분석 준비 중…')
  expect(analyzeButtonLabel({ hasImage: true, gender: '남', loading: true, preparing: false, label: '관상 보기' })).toBe('분석 중…')
  expect(analyzeButtonLabel({ hasImage: true, gender: '남', loading: false, preparing: false, label: '관상 보기' })).toBe('관상 보기')
})

test('시작 화면: 성별 미선택이면 분석 버튼이 비활성, 사진 안내 문구가 버튼 위에 있다', () => {
  const html = renderToStaticMarkup(<TestStart {...base} image="data:image/png;base64,AA" />)
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>성별을 먼저 골라 주세요/)
  const note = html.indexOf('사진은 내 폰 안에서만 보고 바로 지워요')
  expect(note).toBeGreaterThan(0)
  expect(note).toBeLessThan(html.indexOf('성별을 먼저 골라 주세요'))
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
})

test('사진과 성별이 다 있으면 분석 버튼이 활성', () => {
  const html = renderToStaticMarkup(<TestStart {...base} image="data:image/png;base64,AA" gender="여" />)
  expect(html).toMatch(/<button(?![^>]*disabled="")[^>]*>관상 보기/)
})
