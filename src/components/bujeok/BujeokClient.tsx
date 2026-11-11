'use client'
// /bujeok 화면: form → done. 완성 화면에서 카드가 돌며 나타난다(손으로 돌려 볼 수 있다). 서버 호출 없이 브라우저에서 만들고 저장한다.
import { useEffect, useRef, useState } from 'react'
import { useBackOrHome } from '@/hooks/useBackOrHome'
import TestHeader from '@/components/test/TestHeader'
import BujeokForm, { type FormValues } from './BujeokForm'
import BujeokCard from './BujeokCard'
import BujeokDone from './BujeokDone'
import { track } from '@/lib/analytics'
import { validateBirthDate } from '@/lib/birthDate'
import { elementFromBirth, randomVariant } from '@/lib/bujeok/compose'
import { takeHandedBirth } from '@/lib/bujeok/birthHandoff'
import { cleanName } from '@/lib/bujeok/link'
import { FINISH_DEFAULT, VARIANTS, WISH_DEFAULT_EL, type BujeokSpec, type BujeokStyle, type Wish } from '@/lib/bujeok/keys'

export type Mode = 'mine' | 'gift'
export interface Initial { mode?: Mode; wish?: Wish; style?: BujeokStyle }

const BIRTH_FAIL = '날짜를 다시 확인해 주세요. 음력 윤달은 그 해에 있는 달만 고를 수 있어요.'
const NAME_FAIL = '이름은 한글·영문·숫자로 8자까지 적어 주세요.'

type Phase = 'form' | 'done'

function initialValues(initial?: Initial): FormValues {
  const b = takeHandedBirth()
  return {
    wish: initial?.wish ?? null,
    style: initial?.style ?? null,
    finish: FINISH_DEFAULT,
    birth: b ? { year: String(b.year), month: String(b.month), day: String(b.day) } : { year: '', month: '', day: '' },
    isLunar: b?.isLunar ?? false,
    isLeap: b?.isLeapMonth ?? false,
    name: '',
  }
}

export default function BujeokClient({ initial }: { initial?: Initial }) {
  const goBack = useBackOrHome()
  const [values, setValues] = useState<FormValues>(() => initialValues(initial))
  const [phase, setPhase] = useState<Phase>('form')
  const [spec, setSpec] = useState<BujeokSpec | null>(null)
  const [madeName, setMadeName] = useState<string | null>(null)
  const [playKey, setPlayKey] = useState(0)
  const [failText, setFailText] = useState<string | null>(null)
  const panel = useRef<HTMLDivElement>(null)

  const { wish, style, finish, birth, isLunar, isLeap } = values
  const anyBirth = !!(birth.year || birth.month || birth.day)
  const dateCheck = validateBirthDate(birth, new Date(), { lunar: isLunar })
  const birthBlocked = anyBirth && !dateCheck.ok
  const birthError = dateCheck.error ?? (birthBlocked ? '년·월·일을 모두 넣거나 모두 비워 주세요' : null)
  const rawName = values.name.trim()
  const nameOk = rawName === '' || cleanName(rawName) !== null
  const nameError = nameOk ? null : NAME_FAIL
  const canSubmit = !!wish && !!style && !birthBlocked && nameOk

  const onValues = (next: FormValues) => {
    setFailText(null)
    setValues(next)
  }

  const start = () => {
    if (!wish || !style || !canSubmit) return
    let el = WISH_DEFAULT_EL[wish]
    if (anyBirth) {
      const r = elementFromBirth(
        { year: Number(birth.year), month: Number(birth.month), day: Number(birth.day), isLunar, isLeapMonth: isLunar && isLeap },
        wish,
      )
      if (!r) {
        // 틀린 생년월일로 조용히 다른 부적을 주지 않는다
        setFailText(BIRTH_FAIL)
        return
      }
      el = r
    }
    const n = cleanName(rawName)
    setMadeName(n)
    setSpec({ style, wish, el, variant: randomVariant(), finish })
    setPlayKey((k) => k + 1)
    setPhase('done')
    track('test_start', { test_name: 'bujeok' })
    track('result_view', { test_name: 'bujeok', result_id: `${style}_${wish}` })
  }

  const retry = () => {
    if (!spec) return
    // 같은 소원·기운에서 변형 번호만 새로 뽑는다(현재와 다른 번호)
    const variant = (spec.variant + 1 + Math.floor(Math.random() * (VARIANTS - 1))) % VARIANTS
    setSpec({ ...spec, variant })
    setPlayKey((k) => k + 1) // 새 카드가 다시 돌며 나타난다
    setPhase('done')
    track('result_view', { test_name: 'bujeok', result_id: `${spec.style}_${spec.wish}` })
  }

  const inRun = phase === 'done' && spec
  // 폼 아래쪽에서 눌러도 카드가 화면에 들어오게 한다(다시 만들기도 같다)
  useEffect(() => {
    if (inRun) panel.current?.scrollIntoView?.({ block: 'nearest' })
  }, [inRun, playKey])
  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-[22px] max-w-lg pb-6">
        <TestHeader title="나만의 부적" onBack={() => (inRun ? setPhase('form') : goBack())} backLabel={inRun ? '다시하기' : '돌아가기'} />

        {inRun ? (
          <div>
            <div ref={panel} className="mx-auto max-w-[420px]">
              <BujeokCard spec={spec} name={madeName} enter playKey={playKey} />
            </div>
            <BujeokDone spec={spec} getSvg={() => panel.current?.querySelector('[data-bujeok-art] svg') ?? null} onRetry={retry} />
          </div>
        ) : (
          <>
            <BujeokForm values={values} onChange={onValues} birthError={birthError} nameError={nameError} canSubmit={canSubmit} onSubmit={start} />
            {failText && <p role="alert" className="mt-3 text-sm text-center text-accent">{failText}</p>}
          </>
        )}
      </main>
    </div>
  )
}
