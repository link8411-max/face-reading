import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { castParam, loadCastImage } from '@/lib/ogCast';
import { CAST } from '@/content/cast';
import { ogImgParam } from '@/lib/ogArt';

export const runtime = 'edge';

// 검색·공유 미리보기(OG) 이미지, 밤 테마(2026-11-14).
// 네이버 검색은 이 그림의 가운데만 정사각형으로 잘라 썸네일로 쓴다(1200×630에서 가운데 약 630×630).
// 그래서 그림(그 페이지의 캐릭터·초상화)을 가운데 630 폭 안에 크게 두고, 제목은 그 아래 가운데에 둔다.
// ?img= 는 허용한 우리 그림 경로만 최대 둘(lib/ogArt.ts), 없으면 ?cast= 캐릭터 얼굴(허용 목록, 없으면 해태). 그림을 1.5초 안에 못 받으면 그림 없이 그린다.
const BG = '#0B1026';
const INK = '#EEF0FA';
const MUTED = '#A3A9C6';
const ACCENT = '#9DB2FF';

async function loadImg(path: string, base: string): Promise<ArrayBuffer | undefined> {
  try {
    const res = await fetch(new URL(path, base), { signal: AbortSignal.timeout(1500) });
    return res.ok ? await res.arrayBuffer() : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = (searchParams.get('title') || '운명을 읽다').slice(0, 40);
    const subtitle = (searchParams.get('subtitle') || '사진 한 장으로 보는 관상과 운세').slice(0, 60);
    const imgs = ogImgParam(searchParams.get('img'));
    const castKey = castParam(searchParams.get('cast'));

    const loaded = imgs.length > 0
      ? (await Promise.all(imgs.map((p) => loadImg(p, request.url)))).filter((b): b is ArrayBuffer => !!b)
      : [];
    const castImg = loaded.length === 0 ? await loadCastImage(castKey, request.url) : undefined;

    // 그림 칸: 가운데 정사각형(630) 안. 둘이면 3:4 두 장 나란히, 하나면 정사각 한 장
    const pair = loaded.length >= 2;
    const art = pair ? (
      <div style={{ display: 'flex', gap: '18px' }}>
        {loaded.slice(0, 2).map((b, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={b as unknown as string} width={282} height={376} style={{ objectFit: 'cover', borderRadius: '28px', border: '3px solid #2A3360' }} alt="" />
        ))}
      </div>
    ) : loaded.length === 1 ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={loaded[0] as unknown as string} width={376} height={376} style={{ objectFit: 'cover', borderRadius: '36px', border: '3px solid #2A3360' }} alt="" />
    ) : castImg ? (
      <div style={{ display: 'flex', width: '376px', height: '376px', borderRadius: '50%', backgroundColor: CAST[castKey].bg, border: '6px solid #3E5BFF', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={castImg as unknown as string} width={376} height={376} style={{ objectFit: 'cover' }} alt="" />
      </div>
    ) : (
      <div style={{ display: 'flex', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: '#C6F24E' }} />
    );

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: BG, backgroundImage: 'radial-gradient(circle at 50% 30%, #1B2A6B 0%, #0B1026 62%)', paddingTop: '34px', position: 'relative' }}>
          {art}
          <div style={{ display: 'flex', marginTop: '22px', fontSize: '60px', fontWeight: 700, color: INK, lineHeight: 1.1, textAlign: 'center', maxWidth: '1000px' }}>{title}</div>
          <div style={{ display: 'flex', marginTop: '12px', fontSize: '30px', color: MUTED, textAlign: 'center', maxWidth: '1000px' }}>{subtitle}</div>
          <div style={{ position: 'absolute', left: '48px', top: '40px', display: 'flex', fontSize: '28px', fontWeight: 700, color: ACCENT }}>운명을 읽다</div>
          <div style={{ position: 'absolute', right: '48px', top: '44px', display: 'flex', fontSize: '24px', color: MUTED }}>unse-ai.com</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: unknown) {
    console.error(e);
    return new Response('OG 이미지 생성 실패', { status: 500 });
  }
}
