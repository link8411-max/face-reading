declare module "korean-lunar-calendar" {
  export default class KoreanLunarCalendar {
    setSolarDate(year: number, month: number, day: number): boolean;
    setLunarDate(year: number, month: number, day: number, isIntercalation: boolean): boolean;
    getLunarCalendar(): { year: number; month: number; day: number; intercalation: boolean };
    getSolarCalendar(): { year: number; month: number; day: number };
    getKoreanGapja(): { year: string; month: string; day: string; intercalation: string };
  }
}
