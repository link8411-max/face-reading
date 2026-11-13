import { EnSharePage, enShareMetadata } from "@/components/share/EnSharePage";

type Props = { params: Promise<{ type: string }>; searchParams: Promise<{ s?: string | string[] }> };

// 영어로 보낸 동물상 결과 링크 (검색 제외, 사이트맵 제외)
export const generateMetadata = ({ params, searchParams }: Props) => enShareMetadata("animal", params.then((p) => p.type), searchParams);

export default function Page({ params, searchParams }: Props) {
  return <EnSharePage kind="animal" keyP={params.then((p) => p.type)} searchParams={searchParams} />;
}
