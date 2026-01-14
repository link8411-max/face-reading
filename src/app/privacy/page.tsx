import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보처리방침 | 운명을 읽다",
    description: "운명을 읽다 서비스의 개인정보처리방침입니다. 유저의 소중한 정보를 보호하기 위한 노력을 확인하세요.",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-stone-800 leading-relaxed">
            <h1 className="text-3xl font-bold mb-8 text-[#C41E3A]">개인정보처리방침</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. 개인정보의 수집 및 이용 목적</h2>
                <p>
                    '운명을 읽다'는 서비스 제공을 위해 최소한의 정보만을 사용하며, 수집된 정보는 다음의 목적 이외의 용도로는 사용되지 않습니다.
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>AI 관상 분석 서비스 제공 (사진 데이터 처리)</li>
                    <li>오늘의 운세 및 신년운세 결과 제공 (생년월일 데이터 처리)</li>
                    <li>서비스 개선 및 접속 통계 분석</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. 수집하는 개인정보의 항목</h2>
                <p>
                    서비스 이용 과정에서 아래와 같은 정보들이 생성되어 수집될 수 있습니다.
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>필수 항목: 생년월일, 태어난 시간(운세용), 얼굴 사진(관상용)</li>
                    <li>자동 수집: IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
                </ul>
                <p className="mt-4 font-bold text-[#C41E3A]">
                    ※ 관상 분석을 위해 업로드된 사진은 AI 분석 즉시 휘발성으로 처리되며, 서버에 영구 저장되지 않습니다.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. 개인정보의 보유 및 이용기간</h2>
                <p>
                    원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 분석 데이터는 일회성으로만 사용됩니다.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">4. 쿠키(Cookie) 및 광고 관련 안내</h2>
                <p>
                    본 서비스는 구글 애드센스(Google AdSense) 등 제3자 광고 시스템을 사용하며, 유저의 방문 기록을 기반으로 맞춤형 광고를 제공하기 위해 쿠키를 사용할 수 있습니다. 유저는 브라우저 설정을 통해 쿠키 수집을 거부할 수 있습니다.
                </p>
            </section>

            <section className="mb-8 border-t pt-8">
                <p className="text-sm text-stone-500">
                    공고일자: 2026년 1월 15일<br />
                    시행일자: 2026년 1월 15일
                </p>
            </section>
        </div>
    );
}
