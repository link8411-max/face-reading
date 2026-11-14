// "나올 수 있는 결과" 미리 보기: 제목 + 3열 격자 세로 카드(3:4, 이름 한 줄). 시작 화면의 둘째 탭에 들어간다.
// 서버 HTML에 그림이 있고 모두 lazy. 서버·클라이언트 어디서나 쓴다.
export interface PreviewItem { key: string; src: string; name: string }

export default function ResultPreview({ title, items, ariaLabel }: { title: string; items: PreviewItem[]; ariaLabel?: string }) {
  return (
    <section className="mt-5" aria-label={ariaLabel ?? title} data-result-preview>
      <h3 className="text-[13px] text-muted mb-2.5">{title}</h3>
      <ul className="grid grid-cols-3 gap-2.5 list-none">
        {items.map((it) => (
          <li key={it.key} className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.src} alt={it.name} width={720} height={960} loading="lazy" className="block w-full h-auto aspect-[3/4] rounded-[18px] object-cover bg-card-2 border border-line" />
            <p className="mt-1.5 text-xs text-center truncate">{it.name}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
