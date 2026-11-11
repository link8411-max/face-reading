'use client'
// 부적 만들기 입력: 소원(11)·화풍(2)·마감(3, 기본 금박)은 필수, 생년월일과 이름은 선택.
import BirthDateFields from '@/components/BirthDateFields'
import BujeokSvg from './BujeokSvg'
import type { BirthDateInput } from '@/lib/birthDate'
import { FINISHES, FINISH_LABEL, STYLES, WISH_ORDER, WISH_DEFAULT_EL, type BujeokStyle, type Finish, type Wish } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'

export const STYLE_LABEL: Record<BujeokStyle, string> = { trad: '전통', cute: '귀여운' }
const STYLE_HINT: Record<BujeokStyle, string> = { trad: '한자 글귀 부적', cute: '말랑한 캐릭터' }
const FINISH_HINT: Record<Finish, string> = { paper: '노란 종이에 붉은 선', gold: '먹색 바탕에 금색 선', holo: '금박에 무지갯빛이 비쳐요' }

export interface FormValues {
  wish: Wish | null
  style: BujeokStyle | null
  finish: Finish
  birth: BirthDateInput
  isLunar: boolean
  isLeap: boolean
  name: string
  /** 선물 모드: 보내는 사람 이름(선택). name은 받는 사람 */
  from: string
}

export default function BujeokForm({
  values,
  onChange,
  mode,
  onModeChange,
  birthError,
  nameError,
  fromError,
  canSubmit,
  onSubmit,
}: {
  values: FormValues
  onChange: (next: FormValues) => void
  mode: 'mine' | 'gift'
  onModeChange: (m: 'mine' | 'gift') => void
  birthError: string | null
  nameError: string | null
  fromError: string | null
  canSubmit: boolean
  onSubmit: () => void
}) {
  const set = (p: Partial<FormValues>) => onChange({ ...values, ...p })
  const previewWish: Wish = values.wish ?? 'money'
  const gift = mode === 'gift'
  return (
    <div>
      <div className="mt-2.5 mb-6">
        <h2 className="font-serif font-bold text-[27px] leading-[1.4] break-keep">{gift ? <>소중한 사람에게<br />부적을 선물해요</> : <>소원을 담은<br />나만의 부적</>}</h2>
        <p className="mt-2.5 text-sm text-muted break-keep">
          {gift
            ? '받는 사람 이름을 넣으면 카드 뒷면에 이름이 새겨져요. 링크를 보내면 받은 사람이 열어서 돌려 볼 수 있어요.'
            : '소원 하나를 고르면 손으로 돌려 볼 수 있는 부적 카드가 만들어져요. 잠금화면으로 저장해 두고 힘이 필요할 때 꺼내 보세요.'}
        </p>
      </div>

      <div role="radiogroup" aria-label="만들 종류" className="grid grid-cols-2 gap-2 mb-4">
        {(['mine', 'gift'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => onModeChange(m)}
            className={`h-11 rounded-full text-sm font-medium border transition ${mode === m ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-line'}`}
          >
            {m === 'mine' ? '내 부적' : '선물 보내기'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[28px] p-6 mb-6 border border-line">
        <p id="bujeok-wish-label" className="text-sm font-medium mb-2">어떤 소원을 담을까요?</p>
        <div role="radiogroup" aria-labelledby="bujeok-wish-label" className="grid grid-cols-3 gap-2 mb-6">
          {WISH_ORDER.map((w) => {
            const on = values.wish === w
            return (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ wish: w })}
                className={`h-11 px-1 rounded-full text-sm font-medium whitespace-nowrap border transition ${on ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-line'}`}
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
                  <BujeokSvg spec={{ style: s, wish: previewWish, el: WISH_DEFAULT_EL[previewWish], variant: 0, finish: values.finish }} name={null} lite className="block w-full h-auto" />
                </span>
                <span className="mt-2 block text-sm font-medium">{STYLE_LABEL[s]}</span>
                <span className="block text-xs text-muted">{STYLE_HINT[s]}</span>
              </button>
            )
          })}
        </div>

        <p id="bujeok-finish-label" className="text-sm font-medium mb-2">어떤 마감으로 받을까요?</p>
        <div role="radiogroup" aria-labelledby="bujeok-finish-label" className="grid grid-cols-3 gap-2 mb-1">
          {FINISHES.map((f) => {
            const on = values.finish === f
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={FINISH_LABEL[f]}
                onClick={() => set({ finish: f })}
                className={`rounded-[18px] px-2 py-3 text-center border transition ${on ? 'border-ink bg-card-2' : 'border-line bg-white'}`}
              >
                <span className="block text-sm font-medium">{FINISH_LABEL[f]}</span>
                <span className="block text-xs text-muted break-keep">{FINISH_HINT[f]}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted mb-6 break-keep">저장하는 잠금화면 이미지도 고른 마감 그대로예요.</p>

        {!gift && (
          <>
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

          </>
        )}

        {gift ? (
          <>
            <p className="text-sm font-medium mb-1"><label htmlFor="bujeok-name">받는 사람 이름</label></p>
            <input
              id="bujeok-name"
              type="text"
              autoComplete="off"
              maxLength={20}
              placeholder="카드 뒷면에 새겨 드려요"
              value={values.name}
              onChange={(e) => set({ name: e.target.value })}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'bujeok-name-err' : undefined}
              className="w-full px-4 py-3 bg-white border border-line rounded-xl text-center text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder-muted/60"
            />
            {nameError && <p id="bujeok-name-err" role="status" className="mt-2 text-sm text-center text-accent">{nameError}</p>}
            <p className="text-sm font-medium mt-4 mb-1"><label htmlFor="bujeok-from">보내는 사람 이름</label> <span className="text-muted font-normal">(선택)</span></p>
            <input
              id="bujeok-from"
              type="text"
              autoComplete="off"
              maxLength={20}
              placeholder="내 이름 (비워 두면 숨겨요)"
              value={values.from}
              onChange={(e) => set({ from: e.target.value })}
              aria-invalid={!!fromError}
              aria-describedby={fromError ? 'bujeok-from-err' : undefined}
              className="w-full px-4 py-3 bg-white border border-line rounded-xl text-center text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder-muted/60"
            />
            {fromError && <p id="bujeok-from-err" role="status" className="mt-2 text-sm text-center text-accent">{fromError}</p>}
          </>
        ) : (
          <>
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
          </>
        )}
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
