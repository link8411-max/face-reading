import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보처리방침 | 운명을 읽다",
    description: "운명을 읽다 서비스의 개인정보처리방침입니다. 유저의 소중한 정보를 보호하기 위한 노력을 확인하세요.",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-ink leading-relaxed">
            <h1 className="font-serif text-3xl font-bold mb-8">개인정보처리방침</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. 개인정보의 수집 및 이용 목적</h2>
                <p>
                    '운명을 읽다'는 서비스 제공을 위해 최소한의 정보만을 사용하며, 수집된 정보는 다음의 목적 이외의 용도로는 사용되지 않습니다.
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>관상·동물상·삼국지 닮은꼴 분석 제공 (사진은 이용자 브라우저 안에서만 처리)</li>
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
                    <li>입력 항목: 생년월일, 태어난 시간(운세용). 얼굴 사진은 이용자 브라우저 안에서만 분석되며 수집하지 않습니다.</li>
                    <li>자동 수집: IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
                </ul>
                <p className="mt-4 font-bold text-accent">
                    ※ 얼굴 사진은 이용자의 브라우저 안에서만 분석되며, 서버나 외부 서비스로 전송되거나 저장되지 않습니다.
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

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">5. 방문 통계 분석 (Google 애널리틱스)</h2>
                <p>
                    서비스 개선을 위해 Google 애널리틱스로 방문 통계를 수집합니다. 이 과정에서 쿠키, 접속 기기·브라우저 정보, 유입 경로, 페이지 이동과 같은 이용 기록이 Google에 전송될 수 있습니다.
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>테스트 시작·결과 보기·공유 버튼 누름 같은 이용 흐름과 결과 유형 이름(예: 여우상)만 기록합니다.</li>
                    <li>삼국지 일기토(게임)는 한 판이 끝나면 플레이 기록(시작 장수, 도달 단계, 결과, 고른 보상, 기기 종류)을 저장합니다. 개인을 식별할 수 없는 정보이며 게임 난이도를 조정하는 데에만 씁니다. IP 주소는 저장하지 않습니다.</li>
                    <li>삼국지 일기토 피드백은 직접 보내기를 누를 때만 저장합니다(별점, 한 줄 의견, 시작 장수, 도달 단계, 결과, 기기 종류). 게임을 고치는 데에만 쓰며, 한 줄 의견에는 이름·연락처 같은 개인정보를 적지 말아 주세요.</li>
                    <li>얼굴 사진과 생년월일, 얼굴 측정값은 수집하지 않으며 Google 애널리틱스로 보내지 않습니다.</li>
                    <li>Google 애널리틱스 수집을 원하지 않으면 브라우저의 쿠키 차단이나 Google 애널리틱스 차단 부가 기능(tools.google.com/dlpage/gaoptout)을 이용할 수 있습니다.</li>
                </ul>
            </section>

            <section className="mb-8 border-t pt-8">
                <p className="text-sm text-muted">
                    공고일자: 2026년 1월 15일<br />
                    시행일자: 2026년 1월 15일<br />
                    개정일자: 2026년 10월 28일 (삼국지 일기토 플레이 기록·피드백 항목 추가)
                </p>
            </section>
        </div>
    );
}
