"use client";

import { useEffect, useState } from "react";
import { extractFeatures, checkFrontal, type FeatureVector } from "@/lib/face/landmarkFeatures";
import { toZ } from "@/lib/face/featureStats";
import { matchCharacter, type Gender } from "@/lib/samguk/matcher";
import { samgukCharacters } from "@/lib/samgukDB";
import calibration from "@/lib/samguk/calibration.json";

export interface LabRow {
  src: string;
  expectedId?: string;
  gender: Gender;
  detected: boolean;
  frontal?: { ok: boolean; yawRatio: number };
  features?: FeatureVector;
  matchedId?: string;
  similarity?: number;
}

const TEST_FACES = Array.from({ length: 30 }, (_, i) => `/dev-faces/person${i + 1}.jpg`);

export default function FaceLab() {
  const [rows, setRows] = useState<LabRow[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { detectLandmarks } = await import("@/lib/face/mediapipe");
      const jobs: Omit<LabRow, "detected">[] = [
        ...samgukCharacters.map((c) => ({ src: `/images/samguk/${c.name}.jpg`, expectedId: c.id, gender: c.gender })),
        ...TEST_FACES.flatMap((src) => (["남", "여"] as const).map((gender) => ({ src, gender }))),
      ];
      const out: LabRow[] = [];
      for (const job of jobs) {
        const img = new Image();
        img.src = job.src;
        try { await img.decode(); } catch { out.push({ ...job, detected: false }); continue; }
        const lm = await detectLandmarks(img);
        if (!lm) { out.push({ ...job, detected: false }); continue; }
        const features = extractFeatures(lm);
        const m = matchCharacter(toZ(features), job.gender, calibration.bias);
        out.push({ ...job, detected: true, frontal: checkFrontal(lm), features, matchedId: m.character.id, similarity: m.similarity });
        setRows([...out]);
      }
      (window as unknown as { __lab: LabRow[] }).__lab = out;
      setDone(true);
    })();
  }, []);

  return (
    <main style={{ padding: 16, fontFamily: "monospace", fontSize: 12 }}>
      <h1>face-lab {done ? "done" : "running"} ({rows.length})</h1>
      {rows.map((r, i) => (
        <div key={i}>{r.src} {r.gender} {r.detected ? `${r.matchedId} ${r.similarity}% ${r.frontal?.ok ? "" : "NOT-FRONTAL"}` : "NO FACE"}</div>
      ))}
    </main>
  );
}
