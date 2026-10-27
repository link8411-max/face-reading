"use client";

import { track } from "@/lib/analytics";
import { useState, useRef, useEffect } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useRememberedGender } from "@/hooks/useRememberedGender";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import TestStart from "@/components/test/TestStart";
import SamgukGameCard from "@/components/samguk/SamgukGameCard";
import ResultActions from "@/components/result/ResultActions";
import NextTests from "@/components/result/NextTests";
import { useHandedPhoto } from "@/hooks/useHandedPhoto";
import { useResultShare } from "@/hooks/useResultShare";
import { faceSlug, ogImageUrl, parseShared, shareUrl, SITE } from "@/lib/shareLinks";
import { guardianFor } from "@/lib/samguk/guardian";
import { Icon } from "@/components/icons";
import Link from "next/link";
import { SamgukCharacter } from "@/lib/samgukDB";
import { useScreenshot } from "@/hooks/useScreenshot";
import { matchCharacter } from "@/lib/samguk/matcher";
import calibration from "@/lib/samguk/calibration.json";
import { analyzePhoto, REASON_TEXT } from "@/lib/face/analyzePhoto";

interface AnalysisResult {
  name: string;
  matchReason: string;
  similarity: number;
  faceAnalysis: {
    눈: string;
    코: string;
    입: string;
    얼굴형: string;
    인상: string;
  };
  character: SamgukCharacter;
}

// 코에이 스타일 수평 스탯 바
// 능력치 막대 (코에이 능력치 보기 안)
function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="w-14 flex-none">{label}</span>
      <div className="flex-1 bg-card rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-ink" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right font-medium">{value}</span>
    </div>
  );
}

export default function SamgukPage() {
  const goBack = useBackOrHome();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [gender, setGender] = useRememberedGender(); // 다른 사진 테스트에서 고른 성별을 미리 고른다
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { ref: resultRef, isCapturing, download } = useScreenshot<HTMLElement>();
  const { busy, notice, share: shareCard } = useResultShare(result ? { testName: 'samguk', title: '운명을 읽다 · 나는 삼국지 속 누구?', text: parseShared('samguk', result.character.id, result.similarity)!.phrase, url: shareUrl('samguk', result.character.id, result.similarity), imageUrl: ogImageUrl('samguk', result.character.id, result.similarity) } : null);

  const loadingMessages = [
    "장수들의 명부를 훑어보는 중...",
    "관상에서 영웅의 기개를 찾는 중...",
    "눈매의 기운을 측정하여 지략을 읽는 중...",
    "전장의 용맹함이 누구와 닮았는지 대조 중...",
    "천하를 호령할 기운이 느껴집니다...",
    "거의 다 되었습니다. 영웅의 탄생을 기다리세요..."
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [loading, loadingMessages.length]);

  const getShareOptions = () => ({
    fileName: `삼국지닮은꼴_${result?.character.name || "결과"}`,
    shareTitle: `나의 삼국지 닮은꼴: ${result?.character.name}`,
    shareText: `나는 ${result?.character.name}(${result?.character.hanja})와 ${result?.similarity}% 닮았대요`,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      import("@/lib/face/mediapipe").then((m) => m.prepareLandmarker()).catch(() => {});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      track("photo_selected", { test_name: "samguk" });
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !gender) return;

    setLoading(true);
    track("test_start", { test_name: "samguk" });
    setError(null);
    try {
      // 브라우저 안에서 얼굴 분석 (사진은 서버로 보내지 않음)
      const r = await analyzePhoto(image, gender);
      if (!r.ok) {
        setError(REASON_TEXT[r.reason]);
        return;
      }
      const matched = matchCharacter(r.z, gender, calibration.bias);
      setResult(matched);
      track("result_view", { test_name: "samguk", result_id: matched.character.id });
      // 결과가 나오면 페이지 상단으로 스크롤하여 결과를 바로 볼 수 있게 함
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 올려 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 다른 사진 테스트에서 같은 사진으로 넘어오면 바로 분석
  useHandedPhoto(setImage, !!image && !!gender, () => void analyzeImage());

  const resetAll = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">

      <main className="mx-auto px-[22px] max-w-lg">
        <TestHeader title="삼국지 닮은꼴" onBack={() => (result ? resetAll() : goBack())} backLabel={result ? "다시하기" : "돌아가기"} />

        {!result && (
          <TestStart
            heading={"나는 삼국지 속\n누구?"}
            desc="얼굴 특징을 삼국지 인물 76명의 초상화와 비교해 가장 닮은 장수를 찾아요."
            tips={["정면 사진이 좋아요", "밝은 곳에서"]}
            analyzeLabel="닮은 장수 찾기"
            image={image}
            gender={gender}
            onGender={setGender}
            onFile={handleImageUpload}
            onAnalyze={analyzeImage}
            onReset={resetAll}
            loading={loading}
            error={error}
          />
        )}

        {/* 분석 중 화면 */}
        {loading && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-paper/95 backdrop-blur-sm" role="status" aria-live="polite">
            <div className="max-w-xs w-full px-6 flex flex-col items-center text-center">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-card">
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="w-full h-full object-cover opacity-70" />
                )}
                <div className="absolute left-0 right-0 h-1 bg-accent/70 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              <p className="mt-6 font-serif font-bold text-lg min-h-[3.5em] break-keep">{loadingMessages[loadingStep]}</p>
              <div className="w-full h-1.5 bg-card rounded-full overflow-hidden mt-2">
                <div className="h-full bg-ink transition-all duration-500" style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes scan { 0%, 100% { top: 0%; opacity: 0; } 5% { opacity: 1; } 95% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #6B6259; border-radius: 2px; }
        `}</style>

        {/* Result Section */}
        {result && (() => {
          const guardian = guardianFor(result.character.name);
          return (
            <div className="pb-6 animate-fade-in">
              <SamgukGameCard captureRef={resultRef} character={result.character} similarity={result.similarity} />

              <p className="mt-4 text-[13px] leading-relaxed bg-card-2 rounded-[22px] px-4 py-3">
                <span className="font-bold text-accent">닮은 점</span> {result.matchReason}
              </p>

              <section aria-label="나를 지켜줄 장수" className="mt-3 bg-card rounded-[24px] p-4 flex gap-3.5 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/samguk/${guardian.character.name}.jpg`} alt={`${guardian.character.name} 도트 초상화`} className="w-16 h-[76px] object-cover rounded-xl [image-rendering:pixelated] flex-none" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-accent">나를 지켜줄 장수</p>
                  <p className="font-serif font-bold text-lg mt-1">{guardian.character.name} · 궁합 {guardian.score}점</p>
                  <p className="text-xs leading-normal text-muted mt-1">{guardian.line}</p>
                </div>
              </section>

              <ResultActions
                onShare={shareCard}
                lead={{ label: "우리 팀 삼국지 만들기", href: "/samguk/team" }}
                onSave={() => { track("share_click", { test_name: "samguk", method: "save_image" }); download(getShareOptions()); }}
                onRetry={resetAll}
                busy={busy || isCapturing}
                notice={notice}
              />
              {image && <NextTests current="samguk" image={image} />}
              <div className="mt-2">
                <CoupangBanner subId="samguk" />
              </div>

              <details className="group mt-4 bg-white border border-line rounded-[22px] px-5 py-4">
                <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                  코에이 능력치 보기
                  <Icon name="chevron" size={18} className="text-muted transition group-open:rotate-90" />
                </summary>
                <div className="mt-4 space-y-5 text-sm leading-relaxed">
                  <section>
                    <h3 className="font-serif font-bold text-base mb-2">열전</h3>
                    <p className="font-serif">&quot;{result.character.quote}&quot;</p>
                    <p className="mt-2">{result.character.description}</p>
                  </section>
                  <section className="space-y-2">
                    <h3 className="font-serif font-bold text-base mb-2">능력치</h3>
                    {(["통솔", "무력", "지력", "정치", "매력"] as const).map((k) => (
                      <StatLine key={k} label={k} value={result.character.stats[k]} />
                    ))}
                  </section>
                  <section className="space-y-2">
                    <h3 className="font-serif font-bold text-base mb-2">현대 능력치</h3>
                    <StatLine label="리더십" value={result.character.modernStats.리더십} />
                    <StatLine label="체력" value={result.character.modernStats.체력} />
                    <StatLine label="두뇌" value={result.character.modernStats.두뇌} />
                    <StatLine label="처세술" value={result.character.modernStats.눈치} />
                    <StatLine label="연애력" value={result.character.modernStats.연애력} />
                  </section>
                  <section>
                    <h3 className="font-serif font-bold text-base mb-2">특기</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.character.traits.map((t) => (
                        <span key={t} className="px-3 py-1.5 bg-card-2 rounded-full text-[13px]">{t}</span>
                      ))}
                    </div>
                  </section>
                  <p className="text-xs text-muted">능력치는 삼국지 소설과 고전 게임 속 인물의 모습을 참고했어요.</p>
                </div>
              </details>

            </div>
          );
        })()}

        <p className="text-center text-muted text-xs mt-6 pb-4">재미로만 봐 주세요. 삼국지 소설 속 인상을 참고했어요.</p>
      </main>
    </div>
  );
}
