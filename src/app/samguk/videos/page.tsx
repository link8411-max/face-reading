import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import VideosBrowser, { type Faces } from "@/components/videos/VideosBrowser";
import { hasPerson } from "@/content/samgukPeople/ids";
import { characterById } from "@/lib/people/characters";
import { portraitSrc } from "@/lib/people/portrait";
import { getChannelVideos } from "@/lib/videos/fetch";
import { isVideoId } from "@/lib/videos/format";
import { itemListJsonLd } from "@/lib/videos/jsonld";

export const revalidate = 3600;

export default async function VideosPage() {
  const videos = (await getChannelVideos()).filter((v) => isVideoId(v.id));

  // 클라이언트에는 열전 본문 없이 이름·초상화·열전 유무만 넘긴다.
  const faces: Faces = {};
  for (const v of videos) {
    for (const id of v.people) {
      if (faces[id]) continue;
      const c = characterById(id);
      if (!c) continue;
      faces[id] = { name: c.name, portrait: portraitSrc(id), hasPage: hasPerson(id) };
    }
  }

  const trio = ["liubei", "guanyu", "caocao"].map((id) => portraitSrc(id)).filter((s): s is string => !!s);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {videos.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(videos)).replace(/</g, "\\u003c") }}
        />
      )}
      <main className="mx-auto flex max-w-lg flex-col gap-[18px] px-[22px] pb-12 pt-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-[26px] font-bold">쇼츠로 보는 삼국지</h1>
          <p className="text-sm leading-relaxed text-muted">1분이면 끝나는 삼국지 한 장면. 정사와 연의가 어떻게 다른지 함께 봐요.</p>
        </div>

        <Link href="/samguk" className="flex items-center gap-3 rounded-[22px] bg-navy-game px-4 py-3.5 text-paper">
          <span className="flex" aria-hidden="true">
            {trio.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" width={40} height={40} className={`h-10 w-10 rounded-xl border-2 border-gold-game object-cover [image-rendering:pixelated] ${i > 0 ? "-ml-2.5" : ""}`} />
            ))}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-serif text-base font-bold">내 얼굴은 어떤 장수?</span>
            <span className="text-xs text-gold-game">사진 한 장으로 닮은 장수 찾기</span>
          </span>
        </Link>

        {videos.length === 0 ? (
          <p className="rounded-[22px] bg-card-2 px-5 py-10 text-center text-sm text-muted">아직 올라온 영상이 없어요. 곧 새 영상이 올라와요.</p>
        ) : (
          <VideosBrowser videos={videos} faces={faces} />
        )}

        <CoupangBanner subId="videos-hub" />
      </main>
    </div>
  );
}
