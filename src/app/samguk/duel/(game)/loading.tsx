// 게임 화면은 뼈대 없이 빈 천 배경(뼈대가 게임 위에 번쩍이지 않게)
export default function Loading() {
  return <div className="fixed inset-0 bg-cloth" aria-hidden />;
}
