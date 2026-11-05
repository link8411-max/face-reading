# 아침 운세 웹 푸시 설계

2026-11-05. 사용자와 대화로 정한 내용. "내 판단"은 사용자가 따로 정하지 않아 설계자가 정한 부분이다.

## 왜 만드나

- 사이트 유입이 하루 10~20명이고 다시 오는 장치가 없다(사용자: "앱을 만들어야 리텐션이 오를 텐데"). 앱 대신 PWA 웹 푸시로 "매일 아침 운세"를 보내 다시 오게 한다.
- 오늘의 운세 엔진(설계 `2026-11-05-daily-fortune-engine-design.md`)이 매일·년생마다 다른 한마디를 내므로 알림이 매일 다르다.
- 시각은 **아침 8시 30분 한국 시간**(사용자: 7시는 너무 이르다). 첫 버전은 한 시각 고정.
- 알림 문구는 사용자가 "그래"라고 한 형식: `말띠 오늘 운세 ★★★★ / 활동적으로 움직이면 좋은 날 · 행운 시간 오전 8시` 계열. 엔진의 한마디·별점을 그대로 쓴다.

## 목표

1. /fortune/daily 결과 화면에서 "매일 아침 운세 알림 받기" 한 번으로 구독. 방금 본 년주(예: 경오)로 구독된다.
2. 매일 08:30 KST에 구독자마다 자기 년주의 오늘 운세 알림. 제목 `🐎 경오년 말띠 오늘 운세 ★★★★☆`, 본문 = 엔진 한마디 + 줄바꿈 + `행운 시간 오후 1~3시(미시)`.
3. 알림을 누르면 오늘 운세 결과가 바로 뜬다(`/fortune/daily?gz=경오`, utm으로 유입 집계).
4. 같은 버튼으로 해지. 브라우저에서 알림을 끄거나 구독이 만료되면 서버에서 자동 정리.
5. iOS는 홈 화면에 추가한 PWA에서만 가능하므로, 사파리에서 누르면 설치 안내를 보여 준다.
6. 서버에 생년을 저장하지 않는다. 저장하는 건 구독 주소·키와 년주(60갑자, 60년 단위 묶음)뿐.

## 목표가 아닌 것

- 사용자별 시각 선택, 하루 여러 번, 요일 선택.
- MBTI 운세·신년운세·삼국지 알림(2차).
- 네이티브 앱, 이메일, 카카오 알림톡.
- 로그인·계정. 구독은 기기(브라우저)에 묶인다.
- 알림 열람·클릭의 개인 추적. 집계는 GA utm으로만.

## 하면 안 되는 것 (실패로 본다)

- 8시 30분을 한 시간 이상 벗어나 도착하는 것. Vercel Hobby cron은 ±59분이라 쓰지 않는다(아래 "발송 시각").
- 같은 날 같은 기기에 두 번 보내는 것(재시도·보정 발송이 겹쳐도 하루 1회, `last_sent_on`으로 막는다).
- 어제 운세를 보내는 것. 발송 시각의 KST 날짜로 계산한다.
- 생년·IP·UA를 저장하는 것. 로그에 endpoint 전문을 남기는 것(endpoint는 사실상 기기 식별자).
- 알림 권한을 결과 화면이 뜨자마자 묻는 것. 버튼을 누를 때만 묻는다(브라우저가 자동 요청을 차단하고, 거절하면 되돌리기 어렵다).
- 알림 제목·본문이 비거나 "undefined"가 섞이는 것.

## 구조

```
[브라우저] 결과 화면 버튼 → Notification.requestPermission → pushManager.subscribe(VAPID 공개키)
        → POST /api/push/subscribe { endpoint, keys, ganji }          → Supabase push_subscriptions
[Supabase pg_cron 23:30 UTC(=08:30 KST)] → pg_net POST https://unse-ai.com/api/push/send (Bearer 비밀)
        → 오늘 아직 안 보낸 구독을 읽어 년주별로 운세 계산 → web-push 발송 → last_sent_on 갱신, 죽은 구독 삭제
[서비스워커 sw.js] push 이벤트 → showNotification, notificationclick → 결과 페이지 열기
```

### 저장 (Supabase real-estate 프로젝트, 기존 people_votes와 같은 곳)

`docs/push-subscriptions.sql` (SQL Editor에서 한 번 실행. 배포 전 사용자 승인 뒤 컨트롤러가 실행):

```sql
create table if not exists push_subscriptions (
  endpoint text primary key,             -- 푸시 서비스 주소. 기기 식별자 성격이라 로그에 남기지 않는다
  p256dh text not null,
  auth text not null,
  ganji text not null check (char_length(ganji) = 2),  -- 년주 60갑자, 예 '경오'
  created_at timestamptz not null default now(),
  last_sent_on date,                     -- KST 날짜. 같은 날 두 번 보내지 않는 기준
  fail_count int not null default 0
);
create index if not exists push_subscriptions_pending_idx on push_subscriptions (last_sent_on);
alter table push_subscriptions enable row level security;  -- 정책 없음: service key만

create table if not exists push_send_log (
  id bigserial primary key,
  day date not null,
  started_at timestamptz not null default now(),
  sent int not null, failed int not null, removed int not null, ms int not null
);
alter table push_send_log enable row level security;
```

pg_cron·pg_net 설정(같은 파일 뒤쪽, 비밀값은 Supabase Vault에 넣고 SQL에서 읽는다):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- select vault.create_secret('<PUSH_CRON_SECRET>', 'push_cron_secret');  -- 한 번만, 값은 Vercel 환경변수와 같게
select cron.schedule('daily-push-0830', '30 23 * * *', $$
  select net.http_post(
    url := 'https://unse-ai.com/api/push/send',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret'), 'Content-Type', 'application/json'),
    body := '{}'::jsonb, timeout_milliseconds := 60000)   -- 함수 maxDuration 60초와 맞춤. 응답은 믿지 않고 push_send_log로 확인한다
$$);
select cron.schedule('daily-push-0845-retry', '45 23 * * *', $$ ... 같은 호출 ... $$);  -- 보정 발송(이미 보낸 기기는 last_sent_on으로 건너뜀)
select cron.schedule('daily-push-0900-retry', '0 0 * * *', $$ ... 같은 호출 ... $$);   -- 2차 보정. 그 뒤에도 남으면 그날은 포기한다(내 판단: 지금 규모에서 일어나지 않는다)
```

pg_cron은 UTC 기준이다. 23:30 UTC = 08:30 KST. 한국은 서머타임이 없어 연중 같다. 호출 주소는 정규 도메인 `https://unse-ai.com`(www는 307로 넘어가므로 pg_net이 따라가지 않는다. www로 부르면 안 된다).

### API

- `POST /api/push/subscribe` — JSON만, 같은 사이트 Origin만(`sameSite`), IP당 10분 30회(`voteGuard`와 같은 방식, 별도 인스턴스). 본문 `{ endpoint: string(https, 2048자 이내), keys: { p256dh, auth }, ganji }`. endpoint 호스트는 허용 목록만 받는다(아니면 400): `fcm.googleapis.com`, `*.push.services.mozilla.com`, `web.push.apple.com`, `*.notify.windows.com`, `*.push.samsungosp.com`(내 판단: 임의 주소로 서버가 POST하는 SSRF와 쓰레기 구독으로 발송 한도를 채우는 걸 막는다). `ganji`는 `육십갑자` 60개 중 하나(아니면 400). endpoint 기준 upsert(년주를 바꿔 다시 구독하면 덮어씀, `last_sent_on`은 유지). 응답 `{ ok: true }`. Supabase 설정이 없으면 503.
- `DELETE /api/push/subscribe` — `{ endpoint }` 삭제. 없는 endpoint도 200.
- `POST /api/push/send` — `Authorization: Bearer ${PUSH_CRON_SECRET}` 아니면 401. `preferredRegion` 무관(Hobby는 icn1 고정). 처리:
  1. `today = kstDate(new Date())`.
  2. `last_sent_on is null or last_sent_on < today`인 구독을 `created_at` 오름차순으로 최대 1,000건 읽는다(`endpoint, p256dh, auth, ganji`).
  3. 년주별로 `dailyFortune({ kind: '년주', 천간, 지지 }, now)`를 한 번씩 계산(최대 60번).
  4. 동시 20개씩 `web-push`로 보낸다. TTL 4시간(그 안에 못 받으면 버린다. 저녁에 아침 운세가 오면 안 된다), urgency `normal`.
  5. 성공 → `last_sent_on = today`, `fail_count = 0`. 404·410 → 삭제. 그 외 실패 → `fail_count + 1`, 5 이상이면 삭제.
  6. 45초가 지나면 멈추고 남은 건 보정 발송(08:45, 09:00)이 처리한다. 라우트는 `export const runtime = 'nodejs'`, `export const maxDuration = 60`(Hobby는 Fluid Compute 여부에 따라 최대 60초 또는 300초인데 설정을 모르므로 60초 안에 끝나게 잡는다, 내 판단). 20개 동시·건당 0.5초면 45초에 약 1,800건이라 당분간 한 번에 끝난다. `push_send_log`에 한 줄 남기고 `{ sent, failed, removed, remaining }` 응답.
  로그에는 개수만. endpoint·키는 절대 출력하지 않는다.

### 알림 내용

- 제목: `{띠이모지} {년주}년 {띠}띠 오늘 운세 {★별점☆}` (예 `🐎 경오년 말띠 오늘 운세 ★★★★☆`). 알림 제목은 UI 크롬이 아니라 이모지 허용(내 판단).
- 본문: 엔진 `한마디` 그대로(두 문장) + `\n` + `행운 시간 {행운.시간}`(내 판단: 사용자가 승인한 형식의 행운 시간을 살리되 엔진 표기 그대로 쓴다. 안드로이드는 펼치면 3줄까지 보인다).
- 데이터: `{ url: '/fortune/daily?gz=경오&utm_source=push&utm_medium=web_push&utm_campaign=daily' }`(gz는 URL 인코딩), `tag: 'daily-fortune'`(같은 태그는 덮어써서 알림이 쌓이지 않음).
- 아이콘: `public/icons/icon-192.png`·`icon-512.png`·`apple-touch-icon-180.png`, 배지 `public/icons/badge-96.png`(단색 흰 실루엣, 투명 배경). 안드로이드 알림과 iOS 홈 화면 아이콘은 SVG를 못 쓰므로 PNG를 새로 만든다(기존 SVG에서 sharp로 변환, 내 판단). `manifest.ts`에 PNG 192·512(any·maskable)를 SVG 앞에 추가하고 `layout.tsx`에 `apple-touch-icon` 링크를 넣는다(지금은 홈 화면 추가 시 아이콘이 깨질 수 있다).

### 엔진 추가

- `DailyInput`에 `{ kind: '년주'; 천간: string; 지지: string }`을 더한다. 년생 모드와 같은 계산이고 `나.년주표기`는 채우며 생년은 없다. `나.띠`·`띠이모지`는 지지 인덱스로 `띠동물`·`띠이모지`에서 찾는다(년생 모드는 `년주계산`이 주지만 이 모드는 직접 채워야 한다). 모르는 글자면 throw.
- `/fortune/daily?gz=경오`: `?year=`와 같은 방식으로 읽고 바로 결과, 읽은 뒤 `gz`만 주소에서 지운다(utm 유지). 캡처 제목 "경오년 말띠", no-screenshot 줄은 비움. `?year=`와 둘 다 있으면 `year` 우선.

### 결과 화면 버튼 (`components/fortune/PushToggle.tsx`, 클라이언트)

공유 버튼 묶음 아래, SeasonPicks 위. `no-screenshot`. 상태:

| 순서 | 상태 | 판정 | 표시 |
|---|---|---|---|
| 1 | 카카오톡 인앱 | `isKakaoInApp(ua)` | 안내: "카카오톡 안에서는 알림을 켤 수 없어요." + 버튼 `다른 브라우저로 열기`(`kakaotalk://web/openExternal?url=`, 저장 이미지 안내와 같은 방식) |
| 2 | iOS 미설치 | iOS(UA에 iPhone/iPad, 또는 `Macintosh`이면서 `navigator.maxTouchPoints > 1`)이고 설치 안 됨(`navigator.standalone !== true`이고 `matchMedia('(display-mode: standalone)')`도 아님) | 안내: "아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요. 공유 버튼 → 홈 화면에 추가 → 홈 화면의 '운명을읽다'를 열어 오늘의 운세에서 생년을 넣고 이 버튼을 눌러 주세요." |
| 3 | 지원 안 함 | `!('PushManager' in window)` 또는 `!('serviceWorker' in navigator)` 또는 공개키 없음 | 아무것도 안 그림 |
| 4 | 차단됨 | `Notification.permission === 'denied'` | "알림이 차단돼 있어요. 브라우저 설정에서 unse-ai.com 알림을 허용하면 받을 수 있어요." |
| 5 | 미구독 | `getSubscription()`이 null | 버튼 `매일 아침 8시 30분, 오늘 운세 받기` (흰 pill, 아이콘 `bell`) |
| 6 | 구독 중 | 구독 있음 | 버튼 `아침 운세 알림 끄기` + 작은 글씨 `{년주}년 {띠}띠로 받고 있어요` |

순서가 중요하다. iOS 일반 사파리에는 `PushManager`가 없어서 3을 먼저 보면 2의 안내가 영영 안 나온다(검토에서 확인). iOS는 사파리와 홈 화면 앱의 저장소가 분리돼 방금 본 년주를 넘길 수 없다. 설치 뒤 생년을 한 번 다시 넣는 흐름으로 간다(내 판단: start_url에 년주를 싣는 방식은 manifest를 바꿔야 하고 다른 사용자에게도 영향이 가서 뺀다).

누르면: `requestPermission()` → `granted`면 `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → `POST /api/push/subscribe`. 서버가 실패하면 브라우저 구독도 `unsubscribe()`하고 "지금은 등록이 안 돼요. 잠시 뒤 다시 눌러 주세요". 성공하면 `알림을 켰어요. 내일 아침 8시 30분에 처음 와요` 토스트(role=status). 끄기: `unsubscribe()` + `DELETE`.
구독 중에 다른 년주 결과에서 버튼이 보이면 라벨은 `이 년주로 바꿔 받기`(`POST`로 덮어씀).

`Icon` 세트에 `bell` 아이콘을 추가한다(선 굵기 1.6, 기존 규칙).

### 서비스워커 (`public/sw.js`)

- `CACHE_NAME`을 `unmyeong-v2`로 올린다(기존 캐시 정리).
- `push`: `event.data.json()` → `showNotification(title, { body, icon, badge, tag: 'daily-fortune', renotify: true, data: { url } })`. `renotify: true`여야 어제 알림이 남아 있어도 오늘 알림이 소리·진동과 함께 교체된다(false면 무음 교체, 검토에서 확인). 데이터가 없거나 깨지면 기본 알림(제목 `오늘의 운세가 도착했어요`, url `/fortune/daily`)을 띄운다. `userVisibleOnly` 구독은 푸시를 받으면 반드시 알림을 보여야 하고, 안 보이면 크롬은 '백그라운드에서 업데이트됨'을 띄우고 사파리는 구독을 철회한다.
- `notificationclick`: 알림을 닫고, 같은 origin의 열린 창이 있으면 `navigate(url)`+`focus`, 없으면 `openWindow(url)`.
- `pushsubscriptionchange`: `event.oldSubscription.options.applicationServerKey`로 다시 `subscribe`하고 `POST /api/push/subscribe`(년주는 클라이언트가 구독할 때 `IndexedDB`에 저장해 둔 값. 없으면 건너뛴다). sw.js는 번들되지 않아 환경변수를 못 읽는다. 이 이벤트는 브라우저마다 최선 노력 수준이라 만료 정리는 404/410 삭제와 재방문 시 재구독에 기댄다.

### 환경변수 (Vercel Production, 사용자가 크롬에서 넣거나 Aside로 시도)

| 이름 | 값 |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys`의 공개키 |
| `VAPID_PRIVATE_KEY` | 같은 명령의 비밀키 |
| `VAPID_SUBJECT` | `mailto:link8411@gmail.com` |
| `PUSH_CRON_SECRET` | 32바이트 무작위(hex). Supabase Vault의 `push_cron_secret`과 같은 값 |

`SUPABASE_URL`·`SUPABASE_SERVICE_KEY`는 이미 있다. 공개키가 없으면 버튼을 그리지 않는다. 비밀키·cron 비밀이 없으면 `/api/push/send`는 503.

### 통계

- GA `track()`에 이벤트 추가: `push_subscribe { test_name: 'daily', result_id: 년주 }`, `push_unsubscribe { test_name: 'daily' }`, `push_blocked { test_name: 'daily', result_id: 'denied' | 'ios_install' | 'server' }`. 년주는 60갑자 2글자라 허용 키 형식에 맞는다.
- 클릭 유입은 `utm_source=push` 세션으로 본다. 착지 시 `shared_landing { test_name: 'daily', result_id: 'push' }`.
- 발송 결과는 `push_send_log`. 구독자 수는 Supabase SQL로 본다.

### 개인정보처리방침

`/privacy` 5항 목록에 한 줄 추가: "아침 운세 알림을 켜면 브라우저가 발급한 푸시 주소와 키, 선택한 년주(태어난 해의 60갑자)만 저장합니다. 생년·이름·기기 정보는 저장하지 않으며, 알림 끄기를 누르거나 브라우저에서 알림을 차단하면 자동으로 삭제됩니다."

## 검증

- 단위(vitest): ganji 검증(60개 통과, 그 외 400), 알림 제목·본문 생성(별 수·이모지·undefined 없음, 60갑자 전수), 발송 결과 처리(mock web-push: 성공/410/500×5 → last_sent_on·삭제·fail_count), 하루 1회(같은 날 두 번 호출하면 두 번째는 0건), KST 자정 경계, `/api/push/send` 인증(401), `/api/push/subscribe` 검증(Origin·JSON·크기·ganji).
- 소스 테스트: sw.js에 `push`·`notificationclick` 핸들러, `renotify: true`, `unmyeong-v2`; 결과 페이지에 PushToggle이 `no-screenshot`; privacy 문구; manifest에 PNG 아이콘; endpoint 허용 목록(허용 5종 통과, `https://evil.example/x` 400).
- 수동(배포 뒤): 안드로이드 크롬에서 구독 → Supabase에 한 줄 → `/api/push/send`를 비밀 헤더로 직접 호출 → 알림 도착·클릭 착지 확인 → 끄기 → 행 삭제 확인. 아이폰은 홈 화면 추가 뒤 같은 순서. 그 뒤 pg_cron 등록.

## 구현자에게 맡기는 것

- web-push 호출 래퍼의 파일 구조(`lib/push/{server,text,client}.ts` 권장).
- IndexedDB 소량 저장 방식(년주 하나).
- 동시성 제어 구현(20개 배치면 충분).
- PNG 아이콘 생성 스크립트(sharp).

## 순서

1. 엔진 년주 모드 + `?gz=` → 2. SQL 문서·API·발송 모듈(테스트) → 3. sw.js·PushToggle·privacy → 4. 아이콘·환경변수 생성 → 5. 배포 → 6. SQL 실행(사용자 승인) → 7. 수동 검증 → 8. pg_cron 등록.

## 추가 (2026-11-05 저녁): 알림 시각 선택

사용자: "시간 설정이 가능하게 해 줘", 단위는 "일단 30분".

- 시각은 **30분 단위, 05:00~23:30**(38개), 기본 08:30, 한국 시간. 저장 열 `send_at text`('HH:MM', check로 38개만 허용). 식별 정보가 아니므로 개인정보 영향 없음(처리방침 문장에 "알림 시각"을 추가).
- 구독 API 본문에 `sendAt`(선택, 없으면 '08:30'). 구독 중 시각만 바꾸면 같은 endpoint로 다시 POST(upsert가 덮어씀, `last_sent_on` 유지).
- 발송: pg_cron 한 개 `*/30 * * * *`(30분마다, 하루 48회). 각 회차는 `to = 지금 KST HH:MM`, `from = to − 60분`(00:00 아래로 내려가면 00:00)으로 `send_at ∈ (from, to]`이고 오늘 아직 안 보낸 기기에만 보낸다. 한 회차가 죽어도 다음 회차가 한 시간 안의 것을 줍는다. 하루 1회(`last_sent_on`)·실패 하루 1회 집계는 그대로. 기존 08:30/08:45/09:00 세 스케줄은 없앤다.
- 버튼 옆에 시각 고르기(`<select>`). 구독 전엔 고른 뒤 버튼을 누르고, 구독 중엔 바꾸면 바로 다시 등록한다. 버튼 문구 `매일 {시각}에 오늘 운세 받기`, 구독 중 소제목 `{년주}년 {띠}띠 · {시각}로 받고 있어요`, 성공 문구 `알림을 켰어요. {오늘|내일} {시각}에 처음 와요`(고른 시각이 지금보다 뒤면 오늘).
- 시각 표기(한국어): 05:00~10:59 `아침`, 11:00~13:59 `낮`, 14:00~17:59 `오후`, 18:00~20:59 `저녁`, 21:00~23:30 `밤`; 12시간제, 30분은 ` 30분`. 예 `아침 8시 30분`, `낮 12시`, `밤 9시 30분`.
- IndexedDB에 `sendAt`도 저장. 서비스워커의 구독 갱신 POST에도 `sendAt`을 싣는다(없으면 생략 → 서버 기본값).
