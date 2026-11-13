import type { HubFilter } from '@/lib/people/hubFilter'

// 삼국 개략도: 직접 그린 SVG. 위(북)·촉(서남)·오(동남)를 계단형 다각형으로 단순하게 그리고 수도 점을 찍는다.
// 지도를 누르면 세력 선택, 같은 곳을 다시 누르면 전체로 돌아간다. 키보드(Enter·Space)로도 누를 수 있다.
// 가로 360 viewBox를 약 330px로 줄여 보이므로 글자는 viewBox 기준 13 이상(화면에서 11px 이상)으로 쓴다.
type Region = { key: Exclude<HubFilter, 'all' | '기타'>; name: string; points: string; fill: string; fillOn: string; label: [number, number]; capitals: { name: string; at: [number, number]; side?: 'left' | 'right' }[] }

const REGIONS: Region[] = [
  {
    key: '위', name: '위나라',
    points: '12,14 236,14 236,36 292,36 292,52 348,52 348,120 296,120 296,136 228,136 228,148 148,148 148,136 60,136 60,120 12,120',
    fill: '#CCD3DE', fillOn: '#AEBBD0', label: [26, 46],
    capitals: [{ name: '낙양', at: [98, 92] }, { name: '허창', at: [176, 112] }],
  },
  {
    key: '촉', name: '촉나라',
    points: '12,162 60,162 60,150 132,150 132,162 168,162 168,200 184,200 184,244 156,244 156,288 56,288 56,264 12,264',
    fill: '#D0DDC8', fillOn: '#B0CAA2', label: [26, 202],
    capitals: [{ name: '성도', at: [76, 252] }],
  },
  {
    key: '오', name: '오나라',
    points: '204,164 232,164 232,152 312,152 312,164 348,164 348,258 300,258 300,288 220,288 220,250 204,250',
    fill: '#E6CABD', fillOn: '#DAAB97', label: [220, 202],
    capitals: [{ name: '건업', at: [296, 232], side: 'left' }],
  },
]

export default function ThreeKingdomsMap({ count, selected, onSelect }: { count: Record<string, number>; selected: HubFilter; onSelect: (f: HubFilter) => void }) {
  const toggle = (f: Exclude<HubFilter, 'all'>) => onSelect(selected === f ? 'all' : f)
  const keyHandler = (f: Exclude<HubFilter, 'all'>) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(f)
    }
  }
  const dim = (f: HubFilter) => (selected !== 'all' && selected !== f ? 0.5 : 1)
  return (
    <figure className="m-0">
      <svg viewBox="0 0 360 300" role="group" aria-label="삼국 개략도" className="block w-full h-auto rounded-[22px] border border-line bg-card-2">
        <defs>
          <pattern id="tk-dots" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill="#1A1B25" opacity="0.1" />
          </pattern>
        </defs>
        {REGIONS.map((r) => {
          const on = selected === r.key
          return (
            <g
              key={r.key}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={`${r.name} 인물 보기`}
              onClick={() => toggle(r.key)}
              onKeyDown={keyHandler(r.key)}
              className="group cursor-pointer outline-none"
              opacity={dim(r.key)}
            >
              <polygon points={r.points} fill={on ? r.fillOn : r.fill} stroke={on ? '#2D55FF' : '#B8AE9F'} strokeWidth={on ? 3 : 1.5} strokeLinejoin="miter" shapeRendering="crispEdges" className="transition-colors group-hover:brightness-95 group-focus-visible:stroke-accent group-focus-visible:[stroke-width:3px]" />
              <polygon points={r.points} fill="url(#tk-dots)" pointerEvents="none" shapeRendering="crispEdges" />
              <text x={r.label[0]} y={r.label[1]} fontSize="26" fontWeight="700" className="font-serif" fill="#1A1B25" pointerEvents="none">{r.key}</text>
              <text x={r.label[0] + 2} y={r.label[1] + 20} fontSize="13" fill="#5E6070" pointerEvents="none">{count[r.key] ?? 0}명</text>
              {r.capitals.map((c) => (
                <g key={c.name} pointerEvents="none">
                  <circle cx={c.at[0]} cy={c.at[1]} r="4" fill="#1A1B25" />
                  <circle cx={c.at[0]} cy={c.at[1]} r="7" fill="none" stroke="#1A1B25" strokeWidth="1" opacity="0.5" />
                  <text x={c.side === 'left' ? c.at[0] - 12 : c.at[0] + 12} y={c.at[1] + 4.5} textAnchor={c.side === 'left' ? 'end' : 'start'} fontSize="13" fontWeight="700" fill="#1A1B25">{c.name}</text>
                </g>
              ))}
            </g>
          )
        })}
        <g
          role="button"
          tabIndex={0}
          aria-pressed={selected === '기타'}
          aria-label="군웅 인물 보기"
          onClick={() => toggle('기타')}
          onKeyDown={keyHandler('기타')}
          className="group cursor-pointer outline-none"
          opacity={dim('기타')}
        >
          {/* 눈에 보이는 칩은 작게, 누르는 영역은 위아래·좌우로 넓힌다(화면에서 44px 이상) */}
          <rect x="256" y="0" width="104" height="50" fill="#000" fillOpacity="0" />
          <rect x="268" y="8" width="80" height="28" rx="14" fill={selected === '기타' ? '#1A1B25' : '#F7F8FC'} stroke={selected === '기타' ? '#1A1B25' : '#B8AE9F'} strokeWidth="1.5" className="group-focus-visible:stroke-accent group-focus-visible:[stroke-width:3px]" />
          <text x="308" y="27" textAnchor="middle" fontSize="14" fontWeight="700" fill={selected === '기타' ? '#F7F8FC' : '#1A1B25'} pointerEvents="none">군웅</text>
        </g>
      </svg>
      <figcaption className="mt-2 text-[11px] text-muted">개략도예요. 실제 국경과 다를 수 있어요</figcaption>
    </figure>
  )
}
