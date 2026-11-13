"use client";

import { track } from "@/lib/analytics";
import { useState, useRef } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useRememberedGender } from "@/hooks/useRememberedGender";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import TestStart from "@/components/test/TestStart";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";
import { matchAnimal, type AnimalTypeResult } from "@/lib/animal/matcher";
import { animalArt, artGender } from "@/lib/animal/art";
import animalCalibration from "@/lib/animal/calibration.json";
import { analyzePhoto, failText, holdAtLeast, reasonText } from "@/lib/face/analyzePhoto";
import { animalTypeDB, type AnimalType } from "@/lib/animalTypeDB";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useEnCopy } from "@/lib/i18n/copy";
import { localePath } from "@/lib/i18n/locales";
import { SHARE_PHRASE } from "@/content/en/share";
import type { UiKey } from "@/lib/i18n/dict";
import CastSay from "@/components/cast/CastSay";
import ResultCard, { type ResultCardProps } from "@/components/result/ResultCard";
import ResultActions from "@/components/result/ResultActions";
import NextTests from "@/components/result/NextTests";
import AnalyzingOverlay, { ANALYZE_STEPS, useAnalyzeStep } from "@/components/test/AnalyzingOverlay";
import MoreTests from "@/components/MoreTests";
import NextSteps from "@/components/result/NextSteps";
import { useHandedPhoto } from "@/hooks/useHandedPhoto";
import { useResultShare } from "@/hooks/useResultShare";
import { faceSlug, ogImageUrl, parseShared, shareUrl, SITE } from "@/lib/shareLinks";
import { Icon } from "@/components/icons";

const firstSentence = (t: string) => (t.match(/^.*?[.!?요다](?=\s|$)/)?.[0] ?? t).trim();

type T = (k: UiKey) => string;

// 결과 카드: 동물상은 숫자 특성이 없어서 막대 대신 성격 칩 3개를 쓴다
// en: 영어판이면 영어 동물상 데이터(서버가 내려 줌). 얼굴 특징 묘사(눈·얼굴형)는 한국어로만 계산되므로 영어판 카드에서는 뺀다.
function cardProps(r: AnimalTypeResult, t: T, en?: Record<string, AnimalType>, g: 'f' | 'm' = 'f'): ResultCardProps {
  const data = en?.[r.type] ?? r.data;
  return {
    eyebrow: en ? `${data.name} · ${r.matchScore}% ${t("animal.match")}` : `${data.name} · 닮음 ${r.matchScore}%`,
    title: data.title,
    summary: en ? data.description.split(". ")[0].replace(/\.?$/, ".") : firstSentence(data.description),
    chips: data.personality.positive.slice(0, 3),
    hero: { src: animalArt(r.type, g).src, alt: en ? `${data.name} result illustration` : `${data.name} 결과 그림` },
    reasons: [
      { label: t("animal.charm"), text: data.charm },
      ...(en ? [] : [{ label: t("animal.face"), text: `${r.features.눈} · 얼굴형 ${r.features.얼굴형}` }]),
      ...(r.blend ? [{ label: t("animal.together"), text: en ? `${en[r.blend].name} ${t("animal.blendTail")}` : `${animalTypeDB[r.blend].name} 기운도 함께 있어요` }] : []),
    ],
  };
}

export default function AnimalTypePage() {
  const goBack = useBackOrHome();
  const t = useT();
  const locale = useLocale();
  const en = locale === "en";
  const enAnimals = useEnCopy()?.animals;
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const analyzeStep = useAnalyzeStep(loading, ANALYZE_STEPS.length);
  const steps = [t("analyzing.step1"), t("analyzing.step2"), t("analyzing.step3")];
  const [result, setResult] = useState<AnimalTypeResult | null>(null);
  const [resultG, setResultG] = useState<"f" | "m">("f"); // 결과를 낸 때 고른 성별의 그림
  const [error, setError] = useState<string | null>(null);
  // 성별: 성별별 얼굴 기준값으로 z 점수를 낸다
  const [gender, setGender] = useRememberedGender(); // 다른 사진 테스트에서 고른 성별을 미리 고른다
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { ref: resultRef, isCapturing, download } = useScreenshot<HTMLElement>();
  const { busy, notice, share: shareCard } = useResultShare(result ? { testName: 'animal', title: t('animal.shareTitle'), text: en && enAnimals ? SHARE_PHRASE.animal(enAnimals[result.type].name, result.matchScore) : parseShared('animal', result.type, result.matchScore)!.phrase, url: shareUrl('animal', result.type, result.matchScore, locale, { g: resultG }), imageUrl: ogImageUrl('animal', result.type, result.matchScore, undefined, locale) } : null);

  const d = result ? (enAnimals?.[result.type] ?? result.data) : null;
  const getShareOptions = () => ({
    fileName: `${t("animal.file")}_${d?.name || (en ? "result" : "결과")}`,
    shareTitle: `${t("animal.saveTitle")}: ${d?.name}`,
    shareText: `${d?.title} - ${d?.charm}`,
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
      track("photo_selected", { test_name: "animal" });
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !gender) return;

    setLoading(true);
    track("test_start", { test_name: "animal" });
    setError(null);
    const t0 = Date.now();
    try {
      const r = await analyzePhoto(image, gender);
      if (!r.ok) {
        track("photo_fail", { test_name: "animal", result_id: r.reason });
        await holdAtLeast(t0);
        setError(failText(r, locale));
        return;
      }
      const matched = matchAnimal(r.z, animalCalibration.bias);
      setResultG(artGender(gender));
      setResult(matched);
      track("result_view", { test_name: "animal", result_id: matched.type });
    } catch (err) {
      console.error("Analysis error:", err);
      track("photo_fail", { test_name: "animal", result_id: "read" });
      setError(reasonText("read", locale));
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
        <TestHeader title={t("animal.title")} onBack={() => (result ? resetAll() : goBack())} backLabel={result ? t("btn.tryAgain") : t("btn.back")} />

        {!result && (
          <TestStart
            heading={t("animal.heading")}
            desc={t("animal.desc")}
            tips={[t("animal.tip1"), t("animal.tip2")]}
            analyzeLabel={t("animal.analyze")}
            image={image}
            gender={gender}
            onGender={setGender}
            onFile={handleImageUpload}
            onAnalyze={analyzeImage}
            onReset={resetAll}
            loading={loading}
            error={error}
            imageRef={imageRef}
          />
        )}
        {loading && <AnalyzingOverlay cast="tiger" photo={image ?? undefined} steps={steps} step={analyzeStep} />}

        {/* Result Section */}
        {result && (
          <div className="pb-6 animate-fade-in">
            <div className="mb-3"><CastSay cast="tiger" lineKey="say.animal.reveal" size="sm" locale={locale} /></div>
            <ResultCard captureRef={resultRef} {...cardProps(result, t, en ? enAnimals : undefined, resultG)} />
            <ResultActions
              from="animal"
              onShare={shareCard}
              companion={{ label: t("animal.companion"), href: `${localePath(locale, "/face-match")}?me=${result.type}` }}
              onSave={() => { track("share_click", { test_name: "animal", method: "save_image" }); download(getShareOptions()); }}
              onRetry={resetAll}
              busy={busy || isCapturing}
              notice={notice}
            />
            {!en && (
              <div className="mt-2">
                <CoupangBanner subId="animal" />
              </div>
            )}
            {image && <NextTests current="animal" image={image} />}
            {!en && <NextSteps from="animal" withPhoto={!!image} />}
            <MoreTests current={en ? "/en/animal" : "/animal"} locale={locale} />

            <details className="group mt-4 bg-card border border-line rounded-[22px] px-5 py-4">
              <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                {t("animal.seeMore")}
                <Icon name="chevron" size={18} className="text-muted transition group-open:rotate-90" />
              </summary>
              <div className="mt-4 space-y-5 text-sm leading-relaxed">
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">{d!.title}</h3>
                  <p>{d!.description}</p>
                  {result.secondaryType && (
                    <p className="text-muted text-xs mt-2">{en ? `${enAnimals?.[result.secondaryType]?.name} ${t("animal.alsoHint")}` : `${animalTypeDB[result.secondaryType].name} 느낌도 있어요`}</p>
                  )}
                </section>
                {!en && <section>
                  <h3 className="font-serif font-bold text-base mb-2">{t("animal.features")}</h3>
                  <dl className="grid grid-cols-2 gap-2">
                    {Object.entries(result.features).map(([부위, 설명]) => (
                      <div key={부위} className="bg-card-2 rounded-[18px] p-3 text-center">
                        <dt className="text-xs text-muted">{부위}</dt>
                        <dd className="font-medium mt-0.5">{설명}</dd>
                      </div>
                    ))}
                  </dl>
                </section>}
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">{t("animal.personality")}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {d!.personality.positive.map((p) => (
                      <span key={p} className="px-3 py-1.5 bg-card-2 rounded-full text-[13px]">{p}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-3 mb-1.5">{t("animal.otherSides")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d!.personality.negative.map((p) => (
                      <span key={p} className="px-3 py-1.5 bg-card border border-line rounded-full text-[13px]">{p}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">{t("animal.love")}</h3>
                  <p>{d!.loveStyle}</p>
                </section>
                <section className="grid grid-cols-2 gap-2">
                  <div className="bg-card-2 rounded-[18px] p-3">
                    <p className="text-xs text-muted">{t("animal.best")}</p>
                    <p className="font-medium mt-0.5">{d!.compatibility.best.join(", ")}</p>
                  </div>
                  <div className="bg-card-2 rounded-[18px] p-3">
                    <p className="text-xs text-muted">{t("animal.worst")}</p>
                    <p className="font-medium mt-0.5">{d!.compatibility.worst.join(", ")}</p>
                  </div>
                </section>
                {d!.celebrities.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-2">{t("animal.celebs")}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {d!.celebrities.map((c) => (
                        <span key={c} className="px-3 py-1.5 bg-card-2 rounded-full text-[13px]">{c}</span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </details>

            <Link href={localePath(locale, "/face2")} className="mt-3 flex items-center gap-3 bg-card-2 rounded-[22px] p-4">
              <span className="w-11 h-11 rounded-full bg-paper grid place-items-center"><Icon name="face" size={24} /></span>
              <span className="flex-1">
                <span className="block font-bold">{t("animal.toFace")}</span>
                <span className="block text-xs text-muted mt-0.5">{t("animal.toFaceSub")}</span>
              </span>
              <Icon name="chevron" size={18} className="text-muted" />
            </Link>

          </div>
        )}

        <p className="text-center text-muted text-xs mt-6 pb-4">{t("result.disclaimer")}</p>
      </main>
    </div>
  );
}
