'use client'
// /bujeok 화면: form → rite(마지막 한 획·도장) → done. 완성 화면에서 카드가 돌며 나타난다(손으로 돌려 볼 수 있다). 서버 호출 없이 브라우저에서 만들고 저장한다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBackOrHome } from '@/hooks/useBackOrHome'
import TestHeader from '@/components/test/TestHeader'
import BujeokForm, { type FormValues } from './BujeokForm'
import BujeokCard from './BujeokCard'
import BujeokDone from './BujeokDone'
import BujeokRite, { type RiteSteps } from './BujeokRite'
import BujeokAd from './BujeokAd'
import { useBox } from './useBox'
import type { WeeklyHigh } from '@/lib/zipsise/banner'
import { track } from '@/lib/analytics'
import { validateBirthDate } from '@/lib/birthDate'
import { elementFromBirth, randomVariant } from '@/lib/bujeok/compose'
import { takeHandedBirth } from '@/lib/bujeok/birthHandoff'
import { addToBox, removeFromBox } from '@/lib/bujeok/box'
import { seasonDefaultWish } from '@/lib/bujeok/season'
import { kstDate } from '@/lib/kst'
import { bujeokCode, bujeokMineUrl, cleanName } from '@/lib/bujeok/link'
import { FINISH_DEFAULT, VARIANTS, WISH_DEFAULT_EL, type BujeokSpec, type BujeokStyle, type Finish, type Wish } from '@/lib/bujeok/keys'

export type Mode = 'mine' | 'gift'
export interface Initial { mode?: Mode; wish?: Wish; style?: BujeokStyle; finish?: Finish }

const BIRTH_FAIL = '날짜를 다시 확인해 주세요. 음력 윤달은 그 해에 있는 달만 고를 수 있어요.'
const NAME_FAIL = '이름은 한글·영문·숫자로 8자까지 적어 주세요.'

type Phase = 'form' | 'rite' | 'done'

function initialValues(initial?: Initial): FormValues {
  const b = takeHandedBirth()
  return {
    wish: initial?.wish ?? seasonDefaultWish(new Date()),
    style: initial?.style ?? 'trad',
    finish: initial?.finish ?? FINISH_DEFAULT,
    birth: b ? { year: String(b.year), month: String(b.month), day: String(b.day) } : { year: '', month: '', day: '' },
    isLunar: b?.isLunar ?? false,
    isLeap: b?.isLeapMonth ?? false,
    name: '',
    from: '',
  }
}

export default function BujeokClient({ initial, high = null }: { initial?: Initial; high?: WeeklyHigh | null }) {
  const goBack = useBackOrHome()
  const [values, setValues] = useState<FormValues>(() => initialValues(initial))
  const [phase, setPhase] = useState<Phase>('form')
  const [spec, setSpec] = useState<BujeokSpec | null>(null)
  const [mode, setMode] = useState<Mode>(initial?.mode === 'gift' ? 'gift' : 'mine')
  const [madeName, setMadeName] = useState<string | null>(null)
  const [madeFrom, setMadeFrom] = useState<string | null>(null)
  const [playKey, setPlayKey] = useState(0)
  const [failText, setFailText] = useState<string | null>(null)
  // 점안을 끝낸 날(한국 시간 YYYY-MM-DD): 내 부적이 "내 것이 되는 순간". 이 기기 부적함과 카드 뒷면에만 쓴다
  const [madeAt, setMadeAt] = useState<string | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const boxItems = useBox()
  // 내 부적 N장 = 만든 것 + 받은 것(보낸 것은 따로 센다). 이 기기 저장 개수 그대로
  const boxCount = (boxItems ?? []).filter((i) => i.kind !== 'sent').length
  const savedMine = useRef<{ code: string; to: string | null } | null>(null)
  const origUrl = useRef<string | null>(null)

  const { wish, style, finish, birth, isLunar, isLeap } = values
  const anyBirth = !!(birth.year || birth.month || birth.day)
  const dateCheck = validateBirthDate(birth, new Date(), { lunar: isLunar })
  const birthBlocked = anyBirth && !dateCheck.ok && mode !== 'gift'
  const birthError = dateCheck.error ?? (birthBlocked ? '년·월·일을 모두 넣거나 모두 비워 주세요' : null)
  const rawName = values.name.trim()
  const gift = mode === 'gift'
  // 내 부적: 이름은 선택. 선물: 받는 사람 이름 필수, 보내는 사람 이름은 선택
  const nameOk = gift ? cleanName(rawName) !== null : rawName === '' || cleanName(rawName) !== null
  const nameError = nameOk || (gift && rawName === '') ? null : NAME_FAIL
  const rawFrom = values.from.trim()
  const fromOk = rawFrom === '' || cleanName(rawFrom) !== null
  const fromError = fromOk ? null : NAME_FAIL
  const canSubmit = !birthBlocked && nameOk && fromOk
  // 선물 모드에서는 생년월일 칸이 없으므로 넘겨받은 값이 있어도 쓰지 않는다
  const useBirth = anyBirth && !gift
  // 미리보기 기운: 생년월일이 맞게 들어 있으면 그 기운, 아니면(비었거나 계산 실패) 소원의 기본 기운. 만들 때 실패하면 아래 start()가 안내한다
  const birthEl = useMemo(
    () => (!useBirth || !dateCheck.ok ? null : elementFromBirth({ year: Number(birth.year), month: Number(birth.month), day: Number(birth.day), isLunar, isLeapMonth: isLunar && isLeap }, wish)),
    [useBirth, dateCheck.ok, birth.year, birth.month, birth.day, isLunar, isLeap, wish],
  )
  const previewEl = birthEl ?? WISH_DEFAULT_EL[wish]

  const onValues = (next: FormValues) => {
    setFailText(null)
    setValues(next)
  }

  const start = () => {
    if (!canSubmit) return
    let el = WISH_DEFAULT_EL[wish]
    if (useBirth) {
      const r = birthEl
      if (!r) {
        // 틀린 생년월일로 조용히 다른 부적을 주지 않는다
        setFailText(BIRTH_FAIL)
        return
      }
      el = r
    }
    const n = cleanName(rawName)
    setMadeName(n)
    setMadeAt(null)
    setMadeFrom(gift ? cleanName(rawFrom) : null)
    setSpec({ style, wish, el, variant: randomVariant(), finish })
    setPlayKey((k) => k + 1)
    // 점안: 내 전통 부적은 긋고 도장, 귀여운은 도장만. 선물은 보내는 사람이 긋기만(귀여운 선물은 바로 완성)
    setPhase(gift && style === 'cute' ? 'done' : 'rite')
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

  // 점안이 끝나면 그은 획을 spec에 싣고 완성 화면으로(카드 등장 회전)
  const finishRite = (stroke: string | null) => {
    setSpec((prev) => (prev ? { ...prev, stroke: prev.style === 'trad' && stroke ? stroke : undefined } : prev))
    setMadeAt(gift ? null : kstDate(new Date()))
    setPlayKey((k) => k + 1)
    setPhase('done')
  }
  const riteSteps: RiteSteps = spec?.style === 'trad' ? (gift ? 'draw' : 'draw-seal') : 'seal'

  const inRun = phase === 'done' && spec
  const mineRun = inRun && !gift

  // 내 부적이 완성되면: 부적함(mine)에 남기고, 주소를 내 부적 링크로 바꿔(새로고침·"다른 브라우저로 열기"로도 같은 카드가 열리게) 한다.
  // 다시 만들기로 카드가 바뀌면 이번 화면에서 남긴 이전 항목을 새 항목으로 바꾼다(연타해도 부적함이 불어나지 않게).
  // 생년월일은 주소·저장소에 넣지 않는다(코드에는 기운만 있다). 이름은 # 뒤.
  useEffect(() => {
    if (!mineRun || !spec) return
    const code = bujeokCode(spec)
    const prev = savedMine.current
    if (prev && prev.code !== code) removeFromBox({ code: prev.code, to: prev.to, from: null, kind: 'mine' })
    addToBox({ code, to: madeName, from: null, kind: 'mine', ...(madeAt ? { madeAt } : {}) })
    savedMine.current = { code, to: madeName }
    if (origUrl.current === null) origUrl.current = window.location.pathname + window.location.search
    const u = new URL(bujeokMineUrl(spec, madeName))
    window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash)
  }, [mineRun, spec, madeName, madeAt])
  // 시작 화면으로 돌아가면 주소도 처음으로 되돌린다
  useEffect(() => {
    if (mineRun || origUrl.current === null) return
    window.history.replaceState(window.history.state, '', origUrl.current)
    origUrl.current = null
    savedMine.current = null
  }, [mineRun])
  // 폼 아래쪽에서 눌러도 카드가 화면에 들어오게 한다(다시 만들기도 같다)
  useEffect(() => {
    if (inRun || phase === 'rite') panel.current?.scrollIntoView?.({ block: 'nearest' })
  }, [inRun, phase, playKey])
  return (
    <div className="text-ink">
      <main className="mx-auto px-[22px] max-w-lg pb-6">
        <TestHeader title="나만의 부적" onBack={() => (phase !== 'form' ? setPhase('form') : goBack())} backLabel={phase !== 'form' ? '다시하기' : '돌아가기'} language={false} />

        {phase === 'rite' && spec ? (
          <div ref={panel} className="mx-auto max-w-[420px]">
            <BujeokRite key={playKey} spec={spec} name={madeName} steps={riteSteps} onDone={finishRite} />
          </div>
        ) : inRun ? (
          <div>
            <div ref={panel} className="mx-auto max-w-[420px]">
              <BujeokCard spec={spec} name={madeName} from={madeFrom} madeAt={gift ? null : madeAt} enter playKey={playKey} hideSeal={gift && spec.style === 'trad'} />
            </div>
            {gift && spec.style === 'trad' && <p className="mt-2 text-sm text-center text-muted">도장은 받는 사람이 찍어요</p>}
            <BujeokDone spec={spec} getSvg={() => panel.current?.querySelector('[data-bujeok-art] svg') ?? null} onRetry={retry} gift={gift && madeName ? { to: madeName, from: madeFrom } : undefined} mineName={madeName} ad={<BujeokAd wish={spec.wish} high={high} />} />
          </div>
        ) : (
          <>
            <BujeokForm values={values} onChange={onValues} mode={mode} onModeChange={setMode} boxCount={boxCount} previewEl={previewEl} birthError={birthError} nameError={nameError} fromError={fromError} canSubmit={canSubmit} onSubmit={start} />
            {failText && <p role="alert" className="mt-3 text-sm text-center text-accent">{failText}</p>}
          </>
        )}
      </main>
    </div>
  )
}
