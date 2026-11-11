'use client'
// 부적 만들기 입력: 소원(5)·화풍(2)은 필수, 생년월일과 이름은 선택.
import BirthDateFields from '@/components/BirthDateFields'
import BujeokSvg from './BujeokSvg'
import type { BirthDateInput } from '@/lib/birthDate'
import { STYLES, WISHES, WISH_DEFAULT_EL, type BujeokStyle, type Wish } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'

export const STYLE_LABEL: Record<BujeokStyle, string> = { trad: '전통', cute: '귀여운' }
const STYLE_HINT: Record<BujeokStyle, string> = { trad: '붉은 글씨 노란 종이', cute: '말랑한 캐릭터' }

export interface FormValues {
  wish: Wish | null
  style: BujeokStyle | null
  birth: BirthDateInput
  isLunar: boolean
  isLeap: boolean
  name: string
}

export default function BujeokForm({
  values,
  onChange,
  birthError,
  nameError,
  canSubmit,
  onSubmit,
}: {
  values: FormValues
  onChange: (next: FormValues) => void
  birthError: string | null
  nameError: string | null
  canSubmit: boolean
  onSubmit: () => void
}) {
  const set = (p: Partial<FormValues>) => onChange({ ...values, ...p })
  const previewWish: Wish = values.wish ?? 'money'
  return (
    <div>
      <div className="mt-2.5 mb-6">
        <h2 className="font-serif font-bold text-[27px] leading-[1.4] break-keep">소원을 붓으로 그린<br />나만의 부적</h2>
        <p className="mt-2.5 text-sm text-muted break-keep">소원 하나를 고르면 부적이 그려져요. 잠금화면으로 저장해 두고 힘이 필요할 때 꺼내 보세요.</p>
      </div>

      <div className="bg-white rounded-[28px] p-6 mb-6 border border-line">
        <p id="bujeok-wish-label" className="text-sm font-medium mb-2">어떤 소원을 담을까요?</p>
        <div role="radiogroup" aria-labelledby="bujeok-wish-label" className="flex flex-wrap gap-2 mb-6">
          {WISHES.map((w) => {
            const on = values.wish === w
            return (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ wish: w })}
                className={`h-11 px-5 rounded-full text-sm font-medium border transition ${on ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-line'}`}
              >
                {WISH_TEXT[w].label}
              </button>
            )
          })}
        </div>

        <p id="bujeok-style-label" className="text-sm font-medium mb-2">어떤 그림으로 받을까요?</p>
        <div role="radiogroup" aria-labelledby="bujeok-style-label" className="grid grid-cols-2 gap-3 mb-6">
          {STYLES.map((s) => {
            const on = values.style === s
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={STYLE_LABEL[s]}
                onClick={() => set({ style: s })}
                className={`rounded-[22px] p-3 text-center border transition ${on ? 'border-ink bg-card-2' : 'border-line bg-white'}`}
              >
                <span aria-hidden className="block mx-auto w-[88px] rounded-xl bg-[#1c1512] p-1.5">
                  <BujeokSvg spec={{ style: s, wish: previewWish, el: WISH_DEFAULT_EL[previewWish], variant: 0 }} name={null} lite className="block w-full h-auto" />
                </span>
                <span className="mt-2 block text-sm font-medium">{STYLE_LABEL[s]}</span>
                <span className="block text-xs text-muted">{STYLE_HINT[s]}</span>
              </button>
            )
          })}
        </div>

        <p className="text-sm font-medium mb-1">생년월일 <span className="text-muted font-normal">(선택)</span></p>
        <p className="text-xs text-muted mb-3 break-keep">넣으면 사주에서 부족한 기운을 채워 주는 쪽으로 그려요. 비워 두면 소원에 맞는 기운으로 그려요. 생년월일은 저장하지 않아요.</p>
        <div className="flex justify-center gap-2 mb-4">
          {[false, true].map((lunar) => (
            <button
              key={String(lunar)}
              type="button"
              onClick={() => set({ isLunar: lunar, isLeap: lunar ? values.isLeap : false })}
              aria-pressed={values.isLunar === lunar}
              className={`h-11 px-5 rounded-full text-sm font-medium border transition ${values.isLunar === lunar ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-line'}`}
            >
              {lunar ? '음력' : '양력'}
            </button>
          ))}
        </div>
        {values.isLunar && (
          <div className="mb-4 text-center">
            <label className="inline-flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="checkbox" checked={values.isLeap} onChange={(e) => set({ isLeap: e.target.checked })} className="w-4 h-4 accent-accent" />
              윤달이에요
            </label>
          </div>
        )}
        <BirthDateFields value={values.birth} onChange={(birth) => set({ birth })} error={birthError} />

        <p className="text-sm font-medium mb-1"><label htmlFor="bujeok-name">이름</label> <span className="text-muted font-normal">(선택)</span></p>
        <input
          id="bujeok-name"
          type="text"
          autoComplete="off"
          maxLength={20}
          placeholder="도장에 새겨 드려요"
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'bujeok-name-err' : undefined}
          className="w-full px-4 py-3 bg-white border border-line rounded-xl text-center text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder-muted/60"
        />
        {nameError && <p id="bujeok-name-err" role="status" className="mt-2 text-sm text-center text-accent">{nameError}</p>}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full h-[52px] rounded-full bg-ink text-paper text-[15px] font-medium disabled:opacity-40"
      >
        부적 만들기
      </button>
    </div>
  )
}
