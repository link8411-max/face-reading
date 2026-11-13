import { SharePage, shareMetadata } from "@/components/share/SharePage";

type Props = { params: Promise<{ key: string }>; searchParams: Promise<{ s?: string | string[] }> };

// 친구가 보낸 사주 풀이 링크: 일간 10키만 담는다 (검색 제외, 사이트맵 제외)
export const generateMetadata = ({ params, searchParams }: Props) => shareMetadata("saju", params, searchParams);

export default function Page({ params, searchParams }: Props) {
  return <SharePage kind="saju" params={params} searchParams={searchParams} />;
}
