import KoreanLunarCalendar from "korean-lunar-calendar";
import { 사주분석 } from "@/lib/saju";
import { generateFortune } from "@/lib/fortuneDB";

export interface FortuneRequest {
  year: number;
  month: number;
  day: number;
  hour: string;
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
  const 운세 = generateFortune({
    띠: 사주결과.띠,
    일간오행: 사주결과.일간오행,
    강한오행: 사주결과.강한오행,
    약한오행: 사주결과.약한오행,
    사주: 사주결과.사주,
    음양: 사주결과.음양,
  });

  return {
    사주정보: {
      ...사주결과,
      역법: req.isLunar ? (req.isLeapMonth ? "음력(윤달)" : "음력") : "양력",
      양력: solar,
      시주: req.hour && req.hour !== "모름" ? req.hour : null,
    },
    운세,
  };
}
