"use client";

import { useRef } from "react";
import { sanitizeDigits, type BirthDateInput } from "@/lib/birthDate";

const inputClass =
  "w-full px-4 py-3 bg-white/50 border border-[#C41E3A]/30 rounded-xl text-center text-lg text-[#5C4033] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50 placeholder-[#5C4033]/40";

// 생년월일 입력: 숫자만, 자릿수 제한, 다 채우면 다음 칸으로 자동 이동, 오류는 아래에 문구로 표시
export default function BirthDateFields({
  value,
  onChange,
  error,
}: {
  value: BirthDateInput;
  onChange: (next: BirthDateInput) => void;
  error: string | null;
}) {
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  const setYear = (raw: string) => {
    const year = sanitizeDigits(raw, 4);
    onChange({ ...value, year });
    if (year.length === 4) monthRef.current?.focus();
  };
  const setMonth = (raw: string) => {
    const month = sanitizeDigits(raw, 2);
    onChange({ ...value, month });
    // 2자리를 채웠거나, 2~9로 시작해 더 올 숫자가 없으면 일로 이동
    if (month.length === 2 || /^[2-9]$/.test(month)) dayRef.current?.focus();
  };
  const setDay = (raw: string) => onChange({ ...value, day: sanitizeDigits(raw, 2) });

  return (
    <div className="mb-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-[#5C4033]/70 mb-1" htmlFor="birth-year">년도</label>
          <input id="birth-year" type="text" inputMode="numeric" autoComplete="bday-year" maxLength={4} placeholder="1990"
            value={value.year} onChange={(e) => setYear(e.target.value)} aria-invalid={!!error} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-[#5C4033]/70 mb-1" htmlFor="birth-month">월</label>
          <input id="birth-month" ref={monthRef} type="text" inputMode="numeric" autoComplete="bday-month" maxLength={2} placeholder="5"
            value={value.month} onChange={(e) => setMonth(e.target.value)} aria-invalid={!!error} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-[#5C4033]/70 mb-1" htmlFor="birth-day">일</label>
          <input id="birth-day" ref={dayRef} type="text" inputMode="numeric" autoComplete="bday-day" maxLength={2} placeholder="15"
            value={value.day} onChange={(e) => setDay(e.target.value)} aria-invalid={!!error} className={inputClass} />
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-center text-[#C41E3A]">{error}</p>}
    </div>
  );
}
