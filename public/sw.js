const CACHE_NAME = 'unmyeong-v2';
const urlsToCache = [
  '/',
  '/face2',
  '/fortune',
  '/fortune/daily',
  '/samguk',
  '/animal',
];

// 설치 시 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공하면 캐시 업데이트
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});

// ===== 웹 푸시 =====
const PUSH_ICON = '/icons/icon-192.png';
const PUSH_BADGE = '/icons/badge-96.png';

self.addEventListener('push', (event) => {
  let title = '오늘의 운세가 도착했어요';
  let options = {
    body: '눌러서 확인해 보세요',
    icon: PUSH_ICON,
    badge: PUSH_BADGE,
    tag: 'daily-fortune',
    renotify: true,
    data: { url: '/fortune/daily' },
  };
  try {
    const payload = event.data ? event.data.json() : null;
    if (payload && payload.title && payload.body) {
      title = payload.title;
      options = {
        body: payload.body,
        icon: PUSH_ICON,
        badge: PUSH_BADGE,
        tag: 'daily-fortune',
        renotify: true,
        data: { url: payload.url || '/fortune/daily' },
      };
    }
  } catch (e) {
    // 기본 알림 사용
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/fortune/daily';
  let absolute = new URL('/fortune/daily', self.location.origin).href;
  try {
    const u = new URL(url, self.location.origin);
    // 같은 출처 주소만 연다
    if (u.origin === self.location.origin) absolute = u.href;
  } catch (e) {
    // 기본 주소 사용
  }
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (list) => {
        const client = list.find((c) => c.url.startsWith(self.location.origin));
        if (client) {
          try {
            const navigated = client.navigate ? await client.navigate(absolute) : null;
            if (navigated) return navigated.focus();
          } catch (e) {
            // 아래에서 새 창으로 대체
          }
        }
        return self.clients.openWindow(absolute);
      })
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function idbGet(key) {
  return new Promise((resolve) => {
    try {
      const open = indexedDB.open('unmyeong', 1);
      open.onerror = () => resolve(undefined);
      // 앱이 만든 적 없는 DB면 빈 DB를 만들지 않고 취소한다
      open.onupgradeneeded = (event) => {
        try { event.target.transaction.abort(); } catch (e) { /* 무시 */ }
        resolve(undefined);
      };
      open.onsuccess = () => {
        try {
          const db = open.result;
          if (!db.objectStoreNames.contains('push')) {
            db.close();
            resolve(undefined);
            return;
          }
          const req = db.transaction('push', 'readonly').objectStore('push').get(key);
          req.onsuccess = () => {
            db.close();
            resolve(req.result);
          };
          req.onerror = () => {
            db.close();
            resolve(undefined);
          };
        } catch (e) {
          resolve(undefined);
        }
      };
    } catch (e) {
      resolve(undefined);
    }
  });
}

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const ganji = await idbGet('ganji');
        if (!ganji) return;
        let key =
          event.oldSubscription &&
          event.oldSubscription.options &&
          event.oldSubscription.options.applicationServerKey;
        if (!key) {
          const vapid = await idbGet('vapid');
          if (vapid) key = urlBase64ToUint8Array(vapid);
        }
        if (!key) return;
        const sub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
        const keys = sub.toJSON().keys || {};
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: { p256dh: keys.p256dh, auth: keys.auth },
            ganji,
          }),
        });
      } catch (e) {
        // 무시
      }
    })()
  );
});
