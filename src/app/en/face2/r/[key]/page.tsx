import { EnSharePage, enShareMetadata } from "@/components/share/EnSharePage";

type Props = { params: Promise<{ key: string }>; searchParams: Promise<{ s?: string | string[] }> };

// 영어로 보낸 관상 결과 링크 (검색 제외, 사이트맵 제외)
export const generateMetadata = ({ params, searchParams }: Props) => enShareMetadata("face", params.then((p) => p.key), searchParams);

export default function Page({ params, searchParams }: Props) {
  return <EnSharePage kind="face" keyP={params.then((p) => p.key)} searchParams={searchParams} />;
}
