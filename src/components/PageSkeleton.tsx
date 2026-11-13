// 페이지 이동 중(loading.tsx)에 보이는 뼈대 화면: 제목 줄 하나와 카드 세 개 모양의 회색 덩어리
export default function PageSkeleton() {
  return (
    <div role="status" aria-label="불러오는 중" className="no-screenshot max-w-lg mx-auto px-4 pt-5">
      <div className="skeleton-shimmer h-7 w-40 rounded-lg bg-card-2" />
      <div className="skeleton-shimmer mt-5 h-[200px] rounded-[28px] bg-card-2" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="skeleton-shimmer h-[150px] rounded-[28px] bg-card-2" />
        <div className="skeleton-shimmer h-[150px] rounded-[28px] bg-card-2" />
      </div>
    </div>
  )
}
