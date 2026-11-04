// ffmpeg 경로: FF 환경변수 → ~/.cache/shorts-tools (없으면 npm i ffmpeg-static@5.2.0로 받는다)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
const dir = path.join(os.homedir(), '.cache/shorts-tools')
export const FF = process.env.FF || path.join(dir, 'node_modules/ffmpeg-static/ffmpeg')
if (!fs.existsSync(FF)) {
  fs.mkdirSync(dir, { recursive: true })
  execSync('npm i --prefix . ffmpeg-static@5.2.0 --no-audit --no-fund', { cwd: dir, stdio: 'inherit' })
}
