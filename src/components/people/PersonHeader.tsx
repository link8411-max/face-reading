import { characterById } from '@/lib/people/characters'
import { getPerson } from '@/content/samgukPeople'
import { portraitSrc } from '@/lib/people/portrait'
import TopVerdictChip from './TopVerdictChip'

export function factionLabel(faction: string): string {
  return faction === '기타' ? '그 밖의 세력' : `${faction}나라`
}

// 머리 카드: 초상화(없으면 자리), 소속·역할, 이름·한자·자, 생몰년·출신지
export default function PersonHeader({ id, verdictOptions }: { id: string; verdictOptions?: { key: string; label: string }[] }) {
  const p = getPerson(id)
  const c = characterById(id)
  if (!p || !c) return null
  const src = portraitSrc(id)
  const years = `${p.born ?? '?'} ~ ${p.died ?? '?'}년`
  return (
    <header className="mt-4 flex gap-4 items-center bg-card rounded-[22px] border border-line p-4">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${c.name} 초상`} width={112} height={140} className="w-28 h-[140px] object-cover rounded-2xl border border-line flex-none" />
      ) : (
        <div className="w-28 h-[140px] rounded-2xl border border-dashed border-line bg-card-2 grid place-items-center text-xs text-muted text-center flex-none px-2">
          초상화 추가 예정
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted">{factionLabel(c.faction)} · {c.role}</p>
        <h1 className="font-serif font-bold text-[27px] leading-[1.3] break-keep">
          {c.name} <span className="text-lg text-muted">{c.hanja}</span>
        </h1>
        {p.style && (
          <p className="text-sm">
            자 {p.style}
            {p.styleHanja && <span className="text-muted"> ({p.styleHanja})</span>}
          </p>
        )}
        <p className="mt-1 text-xs text-muted">
          {years}
          {p.birthplace && ` · ${p.birthplace}`}
        </p>
        {verdictOptions && verdictOptions.length > 0 && <TopVerdictChip id={id} options={verdictOptions} />}
      </div>
    </header>
  )
}
