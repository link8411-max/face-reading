"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AnimalType } from "@/lib/animalTypeDB";
import type { GuansangTypeKey, PalaceKey, PalaceLabel, ShapeKey, ZoneKey } from "@/lib/face/guansangKeys";
import type { GuansangTypeCopy } from "@/content/guansang";

// 영어판 결과 문구(큰 데이터). 영어 서버 페이지가 src/content/en/* 를 읽어 props로 내려 주므로
// 한국어 페이지의 클라이언트 번들에는 영어 문구가 들어가지 않는다.
export interface EnGuansangCopy {
  types: Record<GuansangTypeKey, GuansangTypeCopy>;
  shape: Record<ShapeKey, { easy: string; traditional: string; evidence: string }>;
  zone: Record<ZoneKey, { easy: string; traditional: string; evidence: string }>;
  palace: Record<PalaceKey, { easy: string; part: string; traditional: string; lines: Record<PalaceLabel, string>; grow: string }>;
  label: Record<PalaceLabel, string>;
  balancedChip: string;
  foreheadNote: string;
  disclaimer: string;
  schoolNote: string;
}

export interface EnCopy {
  guansang?: EnGuansangCopy;
  animals?: Record<string, AnimalType>;
}

const CopyContext = createContext<EnCopy | null>(null);

export function EnCopyProvider({ copy, children }: { copy: EnCopy; children: ReactNode }) {
  return <CopyContext.Provider value={copy}>{children}</CopyContext.Provider>;
}

/** 영어 페이지 밖(한국어)이면 null */
export function useEnCopy(): EnCopy | null {
  return useContext(CopyContext);
}
