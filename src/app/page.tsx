"use client";

import { useState, useRef } from "react";

interface AnalysisResult {
  type: string;
  title: string;
  traits: string[];
  career: string;
  love: string;
  luckyNumber: number;
  description: string;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch (error) {
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const shareResult = async () => {
    if (!result || !image) return;

    const shareText = `🔮 AI 관상 테스트 결과\n\n나는 "${result.title}" 타입!\n\n✨ 성격: ${result.traits.join(", ")}\n💼 직업: ${result.career}\n💕 연애: ${result.love}\n🍀 행운의 숫자: ${result.luckyNumber}\n\n당신도 테스트 해보세요!`;
    const shareUrl = window.location.origin;

    // 이미지를 Blob으로 변환
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], "face-reading-result.png", { type: blob.type });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "AI 관상 테스트 결과",
          text: shareText,
          url: shareUrl,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "AI 관상 테스트 결과",
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert("결과가 클립보드에 복사되었습니다!");
      }
    } catch (error) {
      // 공유 취소 등의 에러는 무시
      if ((error as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          alert("결과가 클립보드에 복사되었습니다!");
        } catch {
          alert("공유하기를 사용할 수 없습니다.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <main className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            AI 관상 테스트
          </h1>
          <p className="text-gray-300 text-sm">
            AI가 당신의 얼굴에서 숨겨진 성격을 찾아드립니다
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <div
              className="border-2 border-dashed border-purple-400 rounded-xl p-8 text-center cursor-pointer hover:bg-white/5 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="업로드된 이미지"
                    className="mx-auto rounded-lg object-cover max-h-[250px] w-auto"
                  />
                  <p className="text-sm text-gray-400 mt-3">
                    다른 사진을 선택하려면 클릭하세요
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-lg font-medium">사진을 업로드하세요</p>
                  <p className="text-sm text-gray-400 mt-1">
                    얼굴이 잘 보이는 정면 사진이 좋아요
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {image && (
              <button
                onClick={analyzeImage}
                disabled={loading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🔮</span> 관상 분석 중...
                  </span>
                ) : (
                  "🔮 관상 보기"
                )}
              </button>
            )}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 animate-fade-in">
            {/* Type Badge */}
            <div className="text-center mb-6">
              <div className="inline-block px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-sm font-medium mb-3">
                {result.type}
              </div>
              <h2 className="text-2xl font-bold">{result.title}</h2>
            </div>

            {/* Uploaded Image */}
            {image && (
              <div className="flex justify-center mb-6">
                <img
                  src={image}
                  alt="분석된 이미지"
                  className="rounded-full object-cover border-4 border-purple-400 w-[120px] h-[120px]"
                />
              </div>
            )}

            {/* Description */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {result.description}
            </p>

            {/* Traits */}
            <div className="mb-6">
              <h3 className="font-bold text-pink-400 mb-2">✨ 성격 특징</h3>
              <div className="flex flex-wrap gap-2">
                {result.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white/10 rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Career & Love */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-purple-400 mb-1">💼 어울리는 직업</h3>
                <p className="text-sm">{result.career}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-pink-400 mb-1">💕 연애 스타일</h3>
                <p className="text-sm">{result.love}</p>
              </div>
            </div>

            {/* Lucky Number */}
            <div className="text-center mb-6 p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl">
              <p className="text-sm text-gray-400">행운의 숫자</p>
              <p className="text-4xl font-bold">{result.luckyNumber}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={shareResult}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold hover:opacity-90 transition"
              >
                공유하기 📤
              </button>
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition"
              >
                다시하기 🔄
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}
