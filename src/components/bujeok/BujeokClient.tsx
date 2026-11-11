'use client'
// /bujeok 화면: form → drawing → done. 서버 호출 없이 브라우저에서 그리고 저장한다.
import { useRef, useState } from 'react'
import { useBackOrHome } from '@/hooks/useBackOrHome'
import TestHeader from '@/components/test/TestHeader'
import BujeokForm, { type FormValues } from './BujeokForm'
import BujeokReveal from './BujeokReveal'
import BujeokDone from './BujeokDone'
import { track } from '@/lib/analytics'
import { validateBirthDate } from '@/lib/birthDate'
import { elementFromBirth, randomVariant } from '@/lib/bujeok/compose'
import { takeHandedBirth } from '@/lib/bujeok/birthHandoff'
import { cleanName } from '@/lib/bujeok/link'
import { VARIANTS, WISH_DEFAULT_EL, type BujeokSpec, type BujeokStyle, type Wish } from '@/lib/bujeok/keys'

export type Mode = 'mine' | 'gift'
export interface Initial { mode?: Mode; wish?: Wish; style?: BujeokStyle }

const BIRTH_FAIL = '날짜를 다시 확인해 주세요. 음력 윤달은 그 해에 있는 달만 고를 수 있어요.'
const NAME_FAIL = '이름은 한글·영문·숫자로 8자까지 적어 주세요.'

type Phase = 'form' | 'drawing' | 'done'

function initialValues(initial?: Initial): FormValues {
  const b = takeHandedBirth()
  return {
    wish: initial?.wish ?? null,
    style: initial?.style ?? null,
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

  const { wish, style, birth, isLunar, isLeap } = values
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
    setSpec({ style, wish, el, variant: randomVariant() })
    setPlayKey((k) => k + 1)
    setPhase('drawing')
    track('test_start', { test_name: 'bujeok' })
    track('result_view', { test_name: 'bujeok', result_id: `${style}_${wish}` })
  }

  const retry = () => {
    if (!spec) return
    // 같은 소원·기운에서 변형 번호만 새로 뽑는다(현재와 다른 번호)
    const variant = (spec.variant + 1 + Math.floor(Math.random() * (VARIANTS - 1))) % VARIANTS
    setSpec({ ...spec, variant })
    setPlayKey((k) => k + 1)
    setPhase('drawing')
    track('result_view', { test_name: 'bujeok', result_id: `${spec.style}_${spec.wish}` })
  }

  const inRun = phase !== 'form' && spec
  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-[22px] max-w-lg pb-6">
        <TestHeader title="나만의 부적" onBack={() => (inRun ? setPhase('form') : goBack())} backLabel={inRun ? '다시하기' : '돌아가기'} />

        {inRun ? (
          <div>
            <div ref={panel} className="mx-auto max-w-[340px] rounded-[28px] bg-[#1c1512] p-4">
              <BujeokReveal spec={spec} name={madeName} playKey={playKey} onDone={() => setPhase('done')} />
            </div>
            {phase === 'done' ? (
              <BujeokDone spec={spec} getSvg={() => panel.current?.querySelector('svg') ?? null} onRetry={retry} />
            ) : (
              <p className="mt-5 text-center text-sm text-muted" role="status">붓으로 부적을 그리고 있어요…</p>
            )}
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
