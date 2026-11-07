import KoreanLunarCalendar from "korean-lunar-calendar";
import { 사주분석 } from "@/lib/saju";
import { generateFortune } from "@/lib/fortuneDB";
import { computeSaju } from "@/lib/saju/engine";
import { ELEMENTS, type Element, type HourSlotKey } from "@/lib/saju/keys";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";

export interface FortuneRequest {
  year: number;
  month: number;
  day: number;
  hourSlot: HourSlotKey | null;
  isLunar: boolean;
  isLeapMonth: boolean;
}

// 신년운세 계산 (API 라우트에서 호출). 음력이면 양력으로 바꾼 뒤 사주를 계산한다.
const INVALID = { error: "올바른 생년월일을 입력해 주세요." } as const;

export function computeFortune(req: FortuneRequest, now: Date = new Date()) {
  if (![req.year, req.month, req.day].every((v) => Number.isInteger(v))) return INVALID;
  let solar = { year: req.year, month: req.month, day: req.day };
  if (req.isLunar) {
    const cal = new KoreanLunarCalendar();
    if (!cal.setLunarDate(req.year, req.month, req.day, req.isLeapMonth)) {
      return { error: "존재하지 않는 음력 날짜예요. 윤달 여부를 확인해 주세요." } as const;
    }
    const s = cal.getSolarCalendar();
    solar = { year: s.year, month: s.month, day: s.day };
  }

  const solarDate = new Date(solar.year, solar.month - 1, solar.day);
  if (solarDate.getMonth() !== solar.month - 1 || solarDate.getDate() !== solar.day) return INVALID;
  if (solarDate > now) return { error: "아직 오지 않은 날짜예요." } as const;

  let 사주결과;
  try {
    사주결과 = 사주분석(solar.year, solar.month, solar.day);
  } catch {
    return INVALID; // 달력 데이터 범위 밖 (1900 이전 등)
  }
  // '올해'는 신년운세 기준 연도와 실제 올해(KST) 중 늦은 쪽. /api/saju와 같다
  const asOfYear = Math.max(new Date(now.getTime() + 9 * 3600e3).getUTCFullYear(), FORTUNE_YEAR.year);
  // 성별은 받지 않으므로 대운은 계산하지 않는다. 이미 변환한 양력 날짜로 계산한다
  const engine = computeSaju({
    year: solar.year, month: solar.month, day: solar.day,
    hourSlot: req.hourSlot, isLunar: false, isLeapMonth: false, gender: null, asOfYear,
  });
  if (!engine.ok) return INVALID;

  // 강한·약한 오행은 엔진 집계(시간을 알면 8글자, 모르면 6글자). 동점이면 목·화·토·금·수 순서에서 뒤쪽
  let 강한오행: Element = ELEMENTS[0], 약한오행: Element = ELEMENTS[0];
  for (const e of ELEMENTS) {
    if (engine.elements[e] >= engine.elements[강한오행]) 강한오행 = e;
    if (engine.elements[e] <= engine.elements[약한오행]) 약한오행 = e;
  }
  const { pillars } = engine;
  const 사주 = {
    년주: pillars.year.korean,
    월주: pillars.month.korean,
    일주: pillars.day.korean,
  };
  const 운세 = generateFortune({
    띠: 사주결과.띠,
    일간오행: 사주결과.일간오행,
    강한오행,
    약한오행,
    사주,
    음양: 사주결과.음양,
  });

  return {
    사주정보: {
      ...사주결과,
      사주,
      오행분포: engine.elements,
      강한오행,
      약한오행,
      기둥: pillars,
      세운: engine.seun,
      basis: engine.basis,
      역법: req.isLunar ? (req.isLeapMonth ? "음력(윤달)" : "음력") : "양력",
      양력: solar,
      시주: pillars.hour ? pillars.hour.korean : null,
    },
    운세,
  };
}
