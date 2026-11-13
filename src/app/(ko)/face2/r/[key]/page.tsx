import { SharePage, shareMetadata } from "@/components/share/SharePage";

type Props = { params: Promise<{ key: string }>; searchParams: Promise<{ s?: string | string[] }> };

// 친구가 보낸 결과 링크 (검색 제외, 사이트맵 제외)
export const generateMetadata = ({ params, searchParams }: Props) => shareMetadata("face", params, searchParams);

export default function Page({ params, searchParams }: Props) {
  return <SharePage kind="face" params={params} searchParams={searchParams} />;
}
