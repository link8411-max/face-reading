// 브라우저 쪽 푸시 구독 도우미. 권한 요청(requestPermission)은 subscribe()에만 있고, subscribe()는 버튼 클릭에서만 부른다.
import { isKakaoInApp } from '@/lib/kakao'

export type PushUiState = 'kakao' | 'ios_install' | 'unsupported' | 'denied' | 'off' | 'on'
export interface PushEnv {
  ua: string
  hasPush: boolean
  hasSw: boolean
  publicKey: string | null
  permission: NotificationPermission
  standalone: boolean
  maxTouchPoints: number
  subscribed: boolean
}

const isIos = (ua: string, touch: number) => /iPhone|iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1)

// 순서가 중요하다: iOS 사파리에는 PushManager가 없어서 unsupported를 먼저 보면 설치 안내가 안 나온다
export function pushUiState(env: PushEnv): PushUiState {
  if (isKakaoInApp(env.ua)) return 'kakao'
  if (isIos(env.ua, env.maxTouchPoints) && !env.standalone) return 'ios_install'
  if (!env.hasPush || !env.hasSw || !env.publicKey) return 'unsupported'
  if (env.permission === 'denied') return 'denied'
  return env.subscribed ? 'on' : 'off'
}

export function readPushEnv(subscribed: boolean): PushEnv {
  const nav = navigator as Navigator & { standalone?: boolean }
  return {
    ua: navigator.userAgent,
    hasPush: 'PushManager' in window,
    hasSw: 'serviceWorker' in navigator,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
    permission: typeof Notification === 'undefined' ? 'default' : Notification.permission,
    standalone: nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    subscribed,
  }
}

export async function getSubscription(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
    const reg = await navigator.serviceWorker.ready
    return await reg.pushManager.getSubscription()
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('unmyeong', 1)
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('push')) req.result.createObjectStore('push') }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function readStored(key: 'ganji' | 'vapid' | 'sendAt'): Promise<string | null> {
  try {
    const db = await idb()
    return await new Promise((resolve) => {
      const r = db.transaction('push').objectStore('push').get(key)
      r.onsuccess = () => resolve(typeof r.result === 'string' ? r.result : null)
      r.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function saveStored(ganji: string, publicKey: string, sendAt: string): Promise<void> {
  try {
    const db = await idb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction('push', 'readwrite')
      tx.objectStore('push').put(ganji, 'ganji')
      tx.objectStore('push').put(publicKey, 'vapid')
      tx.objectStore('push').put(sendAt, 'sendAt')
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
  } catch { /* 저장 실패는 구독을 막지 않는다 */ }
}

async function clearStored(): Promise<void> {
  try {
    const db = await idb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction('push', 'readwrite')
      tx.objectStore('push').delete('ganji')
      tx.objectStore('push').delete('sendAt')
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
  } catch { /* 무시 */ }
}

export const readStoredGanji = () => readStored('ganji')
export const readStoredSendAt = () => readStored('sendAt')

export async function subscribe(ganji: string, sendAt: string): Promise<'ok' | 'denied' | 'server'> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) return 'server'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'denied'
  try {
    const reg = await navigator.serviceWorker.ready
    let existing = await reg.pushManager.getSubscription()
    if (existing) {
      // VAPID 키가 바뀐 뒤의 옛 구독은 서버가 403으로 거절한다 → 지우고 새 키로 다시 등록
      const storedKey = await readStored('vapid')
      if (storedKey && storedKey !== publicKey) {
        await existing.unsubscribe().catch(() => false)
        existing = null
      }
    }
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
    const json = sub.toJSON()
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth }, ganji, sendAt }),
    }).catch(() => null)
    if (!res || !res.ok) {
      if (!existing) await sub.unsubscribe().catch(() => false)
      return 'server'
    }
    await saveStored(ganji, publicKey, sendAt)
    return 'ok'
  } catch {
    return 'server'
  }
}

export async function unsubscribe(): Promise<void> {
  const sub = await getSubscription()
  if (sub) {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => null)
    await sub.unsubscribe().catch(() => false)
  }
  await clearStored()
}
