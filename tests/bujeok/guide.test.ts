import { readFileSync } from 'node:fs'
import { pageGuides, faqJsonLd } from '@/content/pageGuides'
import { metadata } from '@/app/bujeok/layout'
import { BANNED_PHRASES, EXEMPT_IN_HANJA_MEANING } from '@/lib/bujeok/bannedPhrases'
import { WISH_TEXT } from '@/content/bujeok'
import { WISHES } from '@/lib/bujeok/keys'

const g = pageGuides['/bujeok']
const all = JSON.stringify(g)

test('요약·FAQ 3개 이상·"잠금화면에 까는 방법" 섹션이 있다', () => {
  expect(g.summary.length).toBeGreaterThan(30)
  expect(g.faqs.length).toBeGreaterThanOrEqual(3)
  const sec = g.sections!.find((s) => s.heading.includes('잠금화면에 까는 방법'))!
  expect(sec).toBeTruthy()
  const text = JSON.stringify(sec)
  expect(text).toContain('아이폰')
  expect(text).toContain('갤럭시')
  expect(text).toContain('배경화면')
})

test('지금의 카드를 설명한다: 손으로 돌려 보기·마감 세 가지·확대·축소·뒷면 이름. 붓으로 그려지는 연출은 말하지 않는다', () => {
  for (const w of ['손', '돌려', '종이', '금박', '홀로그램', '확대', '축소', '뒷면', '이름']) expect(all, w).toContain(w)
  expect(all).not.toMatch(/붓으로|그려지|그려 드려요|그리는 모습/)
})

test('소원 열한 가지의 한자 글귀와 한글 뜻이 본문에 있다', () => {
  expect(WISHES).toHaveLength(11)
  expect(g.summary).toContain('열한 가지')
  for (const w of WISHES) {
    expect(all).toContain(WISH_TEXT[w].label)
    expect(all).toContain(WISH_TEXT[w].hanja)
    expect(all).toContain(WISH_TEXT[w].hanjaMeaning)
  }
})

test('효험 단정 표현·오행 한자·이모지가 없다', () => {
  // '들어온다'만 한자 뜻풀이(실제 문구의 번역) 안에서는 허용한다
  const noMeaning = WISHES.reduce((t, w) => t.split(WISH_TEXT[w].hanjaMeaning.replace(/에요$/, '')).join(''), all)
  for (const b of BANNED_PHRASES) expect(EXEMPT_IN_HANJA_MEANING.includes(b as never) ? noMeaning : all).not.toContain(b)
  // 소원 글귀(招財進寶 등)는 허용하고, 그걸 뺀 나머지에 오행 한자가 없어야 한다
  const rest = WISHES.reduce((t, w) => t.split(WISH_TEXT[w].hanja).join(''), all)
  expect(rest).not.toMatch(/[木火土金水]/)
  expect(all).not.toMatch(/\p{Extended_Pictographic}/u)
  expect(all).not.toMatch(/무조건|확실히|반드시|보장/)
})

test('FAQ에 무료·효험·이름 저장 질문이 있고 효험은 재미와 응원이라고 답한다', () => {
  const q = (k: string) => g.faqs.find((f) => f.q.includes(k))!
  expect(q('무료')).toBeTruthy()
  expect(q('효험').a).toMatch(/재미|응원/)
  expect(q('이름').a).toContain('링크')
  expect(JSON.parse(faqJsonLd('/bujeok')).mainEntity.length).toBe(g.faqs.length)
})

test('layout 메타데이터도 지금의 카드를 설명한다', () => {
  const text = `${metadata.title} ${metadata.description}`
  expect(text).toContain('손으로 돌려')
  expect(text).toContain('잠금화면')
  expect(text).not.toMatch(/붓/)
  expect(metadata.alternates?.canonical).toBe('https://unse-ai.com/bujeok')
})

test('화면 문구 어디에도 "붓으로 그려"가 남아 있지 않다', () => {
  for (const f of ['src/components/bujeok/BujeokDone.tsx', 'src/components/bujeok/BujeokForm.tsx', 'src/components/bujeok/GiftLanding.tsx', 'src/app/bujeok/layout.tsx']) {
    expect(readFileSync(f, 'utf8'), f).not.toMatch(/붓으로|그려 드려요/)
  }
})
