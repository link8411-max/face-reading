// 사진 칸 상태 갱신: 사진이나 성별이 바뀌면 이전 분석 결과(동물상·장수)와 오류를 지워 다시 분석하게 한다.
// (지우지 않으면 새 사진이 분석되지 않고 이전 결과로 궁합·팀이 나온다. 장수 후보는 성별로 갈린다.)
type Analyzed = { gender: '여' | '남' | null; image: string | null; error: string | null; animal?: unknown; character?: unknown }

const cleared = <S extends Analyzed>(s: S): S => ({ ...s, error: null, ...('animal' in s ? { animal: null } : {}), ...('character' in s ? { character: null } : {}) })

export function withPhoto<S extends Analyzed>(s: S, image: string): S {
  return cleared({ ...s, image })
}

export function withGender<S extends Analyzed>(s: S, gender: '여' | '남'): S {
  return s.gender === gender ? s : cleared({ ...s, gender })
}
