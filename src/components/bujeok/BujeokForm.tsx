'use client'
// 부적 만들기 첫 화면(시안 A "먹빛 가게"): 들어오면 이미 한 장이 완성돼 있다.
// 큰 그림 → "<소원> 부적" → 뜻 → 큰 버튼 → 다른 소원 타일 → 접힌 칸 둘(그림 바꾸기 · 내 사주로 맞추기·이름 새기기).
// 소원·화풍·마감은 처음부터 값이 있어 고를 것이 없다. 선물 모드는 받는 사람 이름이 필수라 이름 칸이 접히지 않고 보인다.
import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import BirthDateFields from '@/components/BirthDateFields'
import BujeokSvg from './BujeokSvg'
import type { BirthDateInput } from '@/lib/birthDate'
import { FINISHES, FINISH_LABEL, STYLES, WISH_ORDER, WISH_DEFAULT_EL, type BujeokStyle, type ElKey, type Finish, type Wish } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'

export const STYLE_LABEL: Record<BujeokStyle, string> = { trad: '전통', cute: '귀여운' }
const STYLE_HINT: Record<BujeokStyle, string> = { trad: '한자 글귀 부적', cute: '말랑한 캐릭터' }
const FINISH_HINT: Record<Finish, string> = { paper: '노란 종이에 붉은 선', gold: '먹색 바탕에 금색 선', holo: '금박에 무지갯빛이 비쳐요' }

export interface FormValues {
  wish: Wish
  style: BujeokStyle
  finish: Finish
  birth: BirthDateInput
  isLunar: boolean
  isLeap: boolean
  name: string
  /** 선물 모드: 보내는 사람 이름(선택). name은 받는 사람 */
  from: string
}

const inputCls = 'w-full px-4 py-3 bg-white border border-line rounded-xl text-center text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder-muted/60'

function Fold({ id, open, onToggle, title, children }: { id: string; open: boolean; onToggle: () => void; title: ReactNode; children: ReactNode }) {
  return (
    <div>
      <button type="button" className="bj-fold" aria-expanded={open} aria-controls={`bj-fold-${id}`} onClick={onToggle}>
        <span>{title}</span>
        <span aria-hidden>{open ? '－' : '＋'}</span>
      </button>
      {open && (
        <div id={`bj-fold-${id}`} className="bj-fold-body">
          {children}
        </div>
      )}
    </div>
  )
}

export default function BujeokForm({
  values,
  onChange,
  mode,
  onModeChange,
  boxCount,
  previewEl,
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
  /** 부적함의 내 부적(만든 것+받은 것) 장수 */
  boxCount: number
  /** 미리보기 기운: 생년월일로 계산한 값, 없으면 소원의 기본 기운 */
  previewEl: ElKey
  birthError: string | null
  nameError: string | null
  fromError: string | null
  canSubmit: boolean
  onSubmit: () => void
}) {
  const set = (p: Partial<FormValues>) => onChange({ ...values, ...p })
  const gift = mode === 'gift'
  const { wish, style, finish } = values
  const text = WISH_TEXT[wish]
  const anyBirth = !!(values.birth.year || values.birth.month || values.birth.day)
  const [openStyle, setOpenStyle] = useState(false)
  const [openMine, setOpenMine] = useState(anyBirth || !!values.name)
  const heroSpec = { style, wish, el: previewEl, variant: 0, finish }

  return (
    <div>
      <div className="bj-top">
        <div role="radiogroup" aria-label="만들 종류" className="bj-seg">
          {(['mine', 'gift'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => onModeChange(m)}>
              {m === 'mine' ? '내 부적' : '선물하기'}
            </button>
          ))}
        </div>
        {boxCount > 0 && (
          <Link href="/bujeok/box" className="inline-flex items-center min-h-11 text-muted">
            내 부적 {boxCount}장
          </Link>
        )}
      </div>

      <div className="bj-hero" data-testid="bujeok-hero">
        <div className="bj-hero-glow" aria-hidden />
        <BujeokSvg spec={heroSpec} name={null} crop hideSeal={false} />
      </div>

      <h2 className="font-serif font-bold text-[25px] leading-[1.35] text-center mt-[18px] mb-1 text-[#F3D88C]" data-testid="bujeok-wish-title">{text.label} 부적</h2>
      <p className="text-center text-sm text-muted break-keep">
        {style === 'trad' ? (
          <>
            <span className="tracking-[.08em] text-base" style={{ fontFamily: 'var(--font-bujeok-brush), "Kaiti TC", serif' }}>{text.hanja}</span> · {text.hanjaMeaning}
          </>
        ) : (
          text.sub
        )}
      </p>

      {gift && (
        <div className="mt-5">
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
            className={inputCls}
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
            className={inputCls}
          />
          {fromError && <p id="bujeok-from-err" role="status" className="mt-2 text-sm text-center text-accent">{fromError}</p>}
        </div>
      )}

      <button type="button" onClick={onSubmit} disabled={!canSubmit} className="bj-cta">
        {gift ? '이 부적 선물하기' : '이 부적 받기'}
      </button>
      <p className="text-center text-xs text-muted mt-2 break-keep">
        {style === 'trad' ? (gift ? '마지막 한 획은 보내는 사람이 그어 완성해요' : '마지막 한 획은 직접 그어 완성해요') : gift ? '받는 사람에게 링크로 보내요' : '도장을 꾹 눌러 완성해요'}
      </p>

      <h3 className="text-sm font-bold mt-[26px] mb-2.5 text-[#D9C9A8]" id="bujeok-other-label">다른 소원</h3>
      <div className="bj-tiles" role="group" aria-labelledby="bujeok-other-label">
        {WISH_ORDER.map((w) => (
          <button key={w} type="button" aria-pressed={wish === w} aria-label={WISH_TEXT[w].label} className="bj-tile" onClick={() => set({ wish: w })}>
            <span aria-hidden className="block">
              <BujeokSvg spec={{ style, wish: w, el: WISH_DEFAULT_EL[w], variant: 0, finish }} name={null} lite crop className="block w-full h-auto" />
            </span>
            <b aria-hidden>{WISH_TEXT[w].label}</b>
          </button>
        ))}
      </div>

      <Fold id="style" open={openStyle} onToggle={() => setOpenStyle((o) => !o)} title={<>그림 바꾸기 <span className="opacity-60">· {STYLE_LABEL[style]} · {FINISH_LABEL[finish]}</span></>}>
        <p id="bujeok-style-label" className="text-sm font-medium mb-2">어떤 그림으로 받을까요?</p>
        <div role="radiogroup" aria-labelledby="bujeok-style-label" className="grid grid-cols-2 gap-3 mb-5">
          {STYLES.map((s) => {
            const on = style === s
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={STYLE_LABEL[s]}
                onClick={() => set({ style: s })}
                className={`rounded-[22px] p-3 text-center border transition ${on ? 'border-[#E9C46A] bg-card-2' : 'border-line bg-white'}`}
              >
                <span aria-hidden className="block mx-auto w-[88px] rounded-xl bg-[#1c1512] p-1.5">
                  <BujeokSvg spec={{ style: s, wish, el: WISH_DEFAULT_EL[wish], variant: 0, finish }} name={null} lite className="block w-full h-auto" />
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
            const on = finish === f
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={FINISH_LABEL[f]}
                onClick={() => set({ finish: f })}
                className={`rounded-[18px] px-2 py-3 text-center border transition ${on ? 'border-[#E9C46A] bg-card-2' : 'border-line bg-white'}`}
              >
                <span className="block text-sm font-medium">{FINISH_LABEL[f]}</span>
                <span className="block text-xs text-muted break-keep">{FINISH_HINT[f]}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted break-keep">저장하는 잠금화면 이미지도 고른 마감 그대로예요.</p>
      </Fold>

      {!gift && (
        <Fold id="mine" open={openMine} onToggle={() => setOpenMine((o) => !o)} title="내 사주로 맞추기 · 이름 새기기">
          <p className="text-sm font-medium mb-1">생년월일 <span className="text-muted font-normal">(선택)</span></p>
          <p className="text-xs text-muted mb-3 break-keep">넣으면 사주에서 부족한 기운을 채워 주는 쪽으로 그려요. 비워 두면 소원에 맞는 기운으로 그려요. 생년월일은 저장하지 않아요.</p>
          <div className="flex justify-center gap-2 mb-4">
            {[false, true].map((lunar) => (
              <button
                key={String(lunar)}
                type="button"
                onClick={() => set({ isLunar: lunar, isLeap: lunar ? values.isLeap : false })}
                aria-pressed={values.isLunar === lunar}
                className={`h-11 px-5 rounded-full text-sm font-medium border transition ${values.isLunar === lunar ? 'bg-ink text-paper border-transparent' : 'bg-white text-ink border-line'}`}
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
            className={inputCls}
          />
          {nameError && <p id="bujeok-name-err" role="status" className="mt-2 text-sm text-center text-accent">{nameError}</p>}
        </Fold>
      )}
    </div>
  )
}
