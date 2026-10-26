// 생년월일 입력 검증 (운세 입력 폼 공용)
// 오류 문구는 입력창 아래에 그대로 보여준다. 아직 다 입력하지 않은 상태에서는 오류를 띄우지 않는다.

export const MIN_YEAR = 1900;

export interface BirthDateInput { year: string; month: string; day: string }
export interface Validation { ok: boolean; error: string | null }

export function sanitizeDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export function validateBirthYear(year: string, now: Date = new Date()): Validation {
  if (year.length < 4) return { ok: false, error: null };
  const y = Number(year);
  const maxYear = now.getFullYear();
  if (y < MIN_YEAR || y > maxYear) return { ok: false, error: `${MIN_YEAR}~${maxYear}년 사이로 입력해 주세요` };
  return { ok: true, error: null };
}

export function validateBirthDate({ year, month, day }: BirthDateInput, now: Date = new Date(), opts: { lunar?: boolean } = {}): Validation {
  const yearCheck = validateBirthYear(year, now);
  if (yearCheck.error) return yearCheck;
  if (!yearCheck.ok || !month || !day) return { ok: false, error: null };

  const y = Number(year), m = Number(month), d = Number(day);
  if (m < 1 || m > 12) return { ok: false, error: "월은 1~12 사이로 입력해 주세요" };
  // 음력은 한 달이 29일 또는 30일이다. 정확한 길이는 서버에서 변환할 때 확인한다.
  const last = opts.lunar ? 30 : daysInMonth(y, m);
  if (d < 1 || d > last) return { ok: false, error: opts.lunar ? "음력은 30일까지 있어요" : `${m}월은 ${last}일까지 있어요` };
  if (!opts.lunar && new Date(y, m - 1, d) > now) return { ok: false, error: "아직 오지 않은 날짜예요" };
  return { ok: true, error: null };
}
