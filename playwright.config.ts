import { defineConfig, devices } from '@playwright/test'

// E2E: 실제 브라우저로 모든 페이지의 링크·버튼·네비게이션을 점검한다.
// 실행: npm run test:e2e (먼저 next build 후 next start로 띄워서 검사)
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  use: { baseURL: 'http://localhost:3200', ...devices['Pixel 7'] },
  webServer: { command: 'npx next start -p 3200', port: 3200, reuseExistingServer: false, timeout: 60_000 },
})
