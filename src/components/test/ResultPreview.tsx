// "나올 수 있는 결과" 미리 보기 줄: 제목 + 가로로 넘기는 세로 카드(3:4, 폭 120px, 이름 한 줄).
// 서버 HTML에 그림이 있고 모두 lazy. 서버·클라이언트 어디서나 쓴다.
export interface PreviewItem { key: string; src: string; name: string }

export default function ResultPreview({ title, items, ariaLabel }: { title: string; items: PreviewItem[]; ariaLabel?: string }) {
  return (
    <section className="mt-6" aria-label={ariaLabel ?? title} data-result-preview>
      <h3 className="text-[13px] text-muted mb-2.5">{title}</h3>
      <ul className="-mx-[22px] px-[22px] flex gap-2.5 overflow-x-auto pb-1 snap-x list-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <li key={it.key} className="flex-none w-[120px] snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.src} alt={it.name} width={720} height={960} loading="lazy" className="block w-[120px] h-[160px] rounded-[18px] object-cover bg-card-2 border border-line" />
            <p className="mt-1.5 text-xs text-center truncate">{it.name}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
