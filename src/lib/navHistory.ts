// 이 탭에서 사이트 안 페이지 이동이 있었는지 기억한다 (클라이언트 내비게이션 동안 모듈 상태가 유지됨)
let visitedPaths = 0;

export function recordPathVisit(): void {
  visitedPaths += 1;
}

export function canGoBackInApp(): boolean {
  return visitedPaths > 1;
}
