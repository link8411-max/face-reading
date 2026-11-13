import PageSkeleton from "@/components/PageSkeleton";

// 루트가 아니라 notFound·redirect를 쓰는 동적 주소가 없는 화면에만 둔다: loading.tsx가 있으면 응답이 먼저 200으로 나가 404·리다이렉트 상태 코드가 사라진다
export default function Loading() {
  return <PageSkeleton />;
}
