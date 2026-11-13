import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

test('사진을 받는 모든 테스트 시작 화면이 얼굴 인식 모델을 미리 받는다', () => {
  // analyzePhoto를 쓰는 화면 전부(페이지 또는 그 클라이언트 컴포넌트)
  const files = execSync("grep -rl 'analyzePhoto' src/app src/components || true", { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const expected = ['src/app/face2/page.tsx', 'src/app/animal/page.tsx', 'src/app/samguk/(match)/page.tsx', 'src/components/faceMatch/FaceMatchClient.tsx', 'src/components/samguk/TeamClient.tsx']
  for (const f of expected) expect(files, f).toContain(f)
  for (const f of files) expect(readFileSync(f, 'utf8'), f).toContain('prepareLandmarker')
})
