// 영어 서버 페이지가 클라이언트 페이지에 내려 주는 영어 결과 문구(큰 데이터). 서버 전용 모듈.
import * as G from "@/content/en/guansang";
import { animalTypeDB } from "@/content/en/animal";
import type { EnGuansangCopy } from "@/lib/i18n/copy";

export const EN_GUANSANG_COPY: EnGuansangCopy = {
  types: G.GUANSANG_TYPES,
  shape: G.SHAPE_COPY,
  zone: G.ZONE_COPY,
  palace: G.PALACE_COPY,
  label: G.LABEL_COPY,
  balancedChip: G.BALANCED_CHIP,
  foreheadNote: G.FOREHEAD_NOTE,
  disclaimer: G.DISCLAIMER,
  schoolNote: G.SCHOOL_NOTE,
};

export const EN_ANIMALS = animalTypeDB;
