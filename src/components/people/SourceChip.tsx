// 출처 표시: 정사·배송지 주·연의
export default function SourceChip({ source }: { source: string }) {
  return (
    <span className="ml-1.5 inline-block align-middle rounded-full border border-line bg-card-2 px-2 py-px text-[11px] leading-4 text-muted whitespace-nowrap">
      {source}
    </span>
  )
}
