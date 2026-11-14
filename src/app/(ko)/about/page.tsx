import type { Metadata } from "next";
import Link from "next/link";

// 서비스 소개와 결과 계산 방법. 검색 품질 안내(구글 "누가·어떻게·왜", 네이버 "경험과 관점")에 맞춰
// 결과를 무엇으로 계산하는지 사실대로 적는다. 결과 문장을 생성형 AI가 그때그때 짓지 않는다(CLAUDE.md "AI 호출 없음").
export const metadata: Metadata = {
    title: "서비스 소개·결과 계산 방법 | 운명을 읽다",
    description: "운명을 읽다의 관상·동물상·사주·운세 결과를 무엇으로 어떻게 계산하는지, 사진과 생년월일을 어떻게 다루는지 정리했어요.",
    alternates: { canonical: "https://unse-ai.com/about" },
};

const h2 = "font-serif text-xl font-bold mb-3 border-b border-line pb-2";
const card = "p-4 bg-card border border-line rounded-[18px]";

const METHODS: { title: string; href: string; body: string }[] = [
    {
        title: "관상",
        href: "/face2",
        body: "사진 속 얼굴에서 기준점 478개를 찾고(MediaPipe 얼굴 인식 모델), 그 위치로 얼굴형과 이마·코·턱 세 부분의 비율을 재요. 얼굴형 다섯 가지(오행)와 힘이 실린 자리 세 가지(삼정)를 곱한 15가지 유형 중 하나로 나누고, 돈·일·사랑·사람·버팀 다섯 자리를 '강함·보통·키울 곳'으로 읽어요. 해석 문장은 유형마다 미리 써 둔 글이에요.",
    },
    {
        title: "동물상",
        href: "/animal",
        body: "관상과 같은 방법으로 잰 얼굴 특징을 남녀 기준으로 따로 표준화한 뒤, 강아지상·고양이상·여우상 등 13가지 동물상의 특징 묶음과 얼마나 가까운지 비교해요. 한쪽으로 결과가 몰리지 않도록 가상의 얼굴 수천 개로 분포를 미리 확인해 보정해 두었어요.",
    },
    {
        title: "삼국지 닮은꼴",
        href: "/samguk",
        body: "장수마다 그린 초상화에서 같은 방식으로 얼굴 특징을 재 두고, 내 얼굴 특징과 가장 가까운 장수를 찾아요. 초상화는 화풍 차이를 빼고 비교해요.",
    },
    {
        title: "사주·신년운세",
        href: "/saju",
        body: "만세력으로 태어난 해·달·날·시의 네 기둥을 뽑아요. 절기는 한국천문연구원 절기 시각을 기준으로 하고, 자정 경계와 서머타임도 반영해요. 네 기둥에서 다섯 기운(오행)의 많고 적음, 십신, 10년 단위 대운과 올해 흐름을 계산하고, 그 결과에 맞춰 미리 써 둔 해석을 보여 줘요.",
    },
    {
        title: "2027 띠별 운세",
        href: "/fortune/2027",
        body: "2027년 정미년(양의 해)과 각 띠의 관계를 바탕으로 띠마다 따로 쓴 글이에요. 띠는 입춘을 기준으로 바뀌기 때문에, 1월 1일부터 2월 3일 무렵에 태어났다면 전년도 띠를 보시면 돼요.",
    },
    {
        title: "오늘의 운세",
        href: "/fortune/daily",
        body: "태어난 해의 기둥(60갑자 중 하나)과 오늘 날짜의 기둥(일진)이 서로 합이 되는지, 부딪히는지, 북돋는지를 계산해 별점과 한마디, 재물·연애·일·건강운, 행운의 색과 시간을 정해요. 같은 해에 태어난 사람은 같은 날 같은 결과가 나와요.",
    },
    {
        title: "MBTI 궁합",
        href: "/mbti/match",
        body: "두 유형의 네 축(E/I·S/N·T/F·J/P)이 같은지 다른지를 연애·친구·직장마다 다른 무게로 더해 점수를 내요. 널리 쓰이는 궁합표의 경향을 따랐고, 맥락마다 가장 잘 맞는 짝이 100점이 되도록 맞췄어요.",
    },
    {
        title: "삼국지 인물열전",
        href: "/samguk/people",
        body: "정사(역사 기록)와 연의(소설)를 나눠서 써요. 소설에만 있는 이야기는 그렇다고 밝히고, 기록에 없는 명언은 만들지 않아요. 인물마다 사실 검토를 거친 뒤 쉬운 말로 다듬었어요.",
    },
];

export default function AboutPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-ink leading-relaxed">
            <div className="text-center mb-10">
                <h1 className="font-serif text-3xl font-bold">운명을 읽다</h1>
                <p className="text-muted mt-2">관상·사주·운세를 재미있고 쉬운 말로</p>
            </div>

            <section className="mb-10">
                <h2 className={h2}>어떤 곳인가요</h2>
                <p>
                    '운명을 읽다'는 개인이 만들고 운영하는 무료 사이트예요. 사진 한 장, 생년월일 하나로 관상·동물상·사주·운세를
                    가볍게 볼 수 있게 만들었어요. 가입이 없고, 결과는 공유하거나 이미지로 저장할 수 있어요.
                </p>
                <p className="mt-3">
                    결과 문장은 생성형 AI가 그때그때 지어내는 글이 아니에요. 아래처럼 정해진 계산 규칙으로 유형을 고르고,
                    유형마다 미리 써 둔 해석을 보여 줘요. 그래서 같은 사진, 같은 생년월일이면 언제 봐도 같은 결과가 나와요.
                </p>
            </section>

            <section className="mb-10">
                <h2 className={h2}>결과는 이렇게 계산해요</h2>
                <div className="space-y-3">
                    {METHODS.map((m) => (
                        <div key={m.title} className={card}>
                            <h3 className="font-bold mb-1.5">
                                <Link href={m.href} className="text-accent-ink">{m.title}</Link>
                            </h3>
                            <p className="text-sm">{m.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-10">
                <h2 className={h2}>사진과 생년월일은 이렇게 다뤄요</h2>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                    <li>사진은 지금 쓰는 기기의 브라우저 안에서만 분석하고 서버로 보내지 않아요. 페이지를 닫으면 사라져요.</li>
                    <li>생년월일은 결과 계산에만 쓰고 방문 통계·공유 링크·저장 이미지에 넣지 않아요. 아침 운세 알림을 켜면 태어난 해의 간지 두 글자(예: 경오)만 저장해요.</li>
                    <li>방문 통계에는 어떤 결과 유형이 나왔는지 정도만 남겨요. 자세한 내용은 <Link href="/privacy" className="text-accent-ink">개인정보처리방침</Link>에 있어요.</li>
                </ul>
            </section>

            <section className="mb-10">
                <h2 className={h2}>알아 두세요</h2>
                <p className="text-sm text-muted">
                    관상·사주·운세는 전통적으로 전해 온 해석 방법이고 과학적으로 증명된 예측이 아니에요. 재미와 참고로만 봐 주시고,
                    건강·돈·법률처럼 중요한 결정은 전문가와 상의해 주세요.
                </p>
            </section>

            <div className="text-center mt-12">
                <Link href="/" className="px-6 py-3 bg-accent text-white rounded-full">
                    메인으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
