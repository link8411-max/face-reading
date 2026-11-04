import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(__dirname, '..', '..', 'src')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : []
  })
}

function isClient(src: string): boolean {
  const body = src.replace(/^﻿/, '').replace(/^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, '')
  return /^(['"])use client\1/.test(body)
}

const files = walk(SRC).map((p) => ({ p, src: readFileSync(p, 'utf8') }))

describe('영상 서버/클라이언트 경계', () => {
  it('src 파일을 읽었다', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(files.some((f) => isClient(f.src))).toBe(true)
  })

  it('클라이언트 파일은 서버 전용 영상 모듈과 키를 가져오지 않는다', () => {
    const banned = ['@/lib/videos/fetch', '@/lib/videos/parse', '@/lib/videos/forPerson', './fetch', 'YOUTUBE_API_KEY']
    // `import type`은 빌드에서 지워지므로 번들에 들어가지 않는다
    const runtime = (src: string) => src.replace(/^import type [^\n]*$/gm, '')
    const bad = files.filter((f) => isClient(f.src)).flatMap((f) => banned.filter((b) => runtime(f.src).includes(b)).map((b) => `${f.p} -> ${b}`))
    expect(bad).toEqual([])
  })

  it('YOUTUBE_API_KEY는 lib/videos/fetch.ts에서만 쓴다', () => {
    const users = files.filter((f) => f.src.includes('YOUTUBE_API_KEY')).map((f) => f.p.slice(SRC.length + 1))
    expect(users).toEqual(['lib/videos/fetch.ts'])
  })
})
