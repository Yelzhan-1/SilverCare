# SilverCare — план по ТЗ (обновлено 2026-09-20)

Источник: полное ТЗ на доработку + текущий main (после PR #1 и #2).

## Принцип ТЗ (не нарушать)

Любое важное действие: Frontend → Backend → Database → Realtime + Push → другое устройство.
Запрещены: fake push/realtime, только localStorage между девайсами, hardcoded guardian, «скорая вызвана» без API, меддиагнозы, VAPID private key во frontend.

## Что уже есть в main

| Область | Статус |
|---|---|
| Один главный экран, без телефон-рамки и нижних табов | ✅ |
| Sticky 1-клик «Я принял», snooze с persist ringAt | ✅ (есть долг CodeRabbit: очередь alarm) |
| Clayomorphism токены + частичный redesign | 🟡 частично (Today/Alarm/плитки); полный product redesign ещё нужен |
| Emergency countdown UI (локальный emergencyService) | ✅ 15с, RPC + Edge, без fake localStorage |
| Supabase schema + Edge stubs | ✅ send-push / emergency-alert — реальный Web Push |
| Аккаунты Elderly/Guardian + invite | ✅ Sprint A: email+пароль, роли, `family_links` по коду |
| Realtime + Web Push на 2 устройствах | ✅ Sprint B+C |
| Memory pair game по ТЗ (сложность/таймер/пары) | ✅ Sprint F |
| Fall / night / medication escalation | ✅ Sprint D+G |

## Конфликты и как решаем

1. **Кейс хакатона «без сложной регистрации»** vs ТЗ «аккаунты».  
   Решение: лёгкий auth (magic link / PIN / invite-код), пожилой почти сразу на главную; без тяжёлого multi-step signup.
2. В ТЗ **игра в §1**, но в §32 она **PRIORITY 3**.  
   Решение: после P1 emergency demo, не раньше.
3. **Full redesign** в §2 «главный», в §32 — PRIORITY 2.  
   Решение: не блокировать P1; polish UI поверх работающего backend-flow; продолжить clay, убрать vibe-шум.
4. Fall / night breathing — только с честными disclaimers и feature-detect; иначе architecture hooks, не симуляция «медицины».

## Быстрый точный план (спринты)

### Sprint A — Foundation auth + pairing (P1 основа) ✅
- `@supabase/supabase-js`, `src/lib/supabaseClient.ts`, RLS 004–005 применены.
- Roles: elderly | caregiver (`profiles` + sub-profiles + `family_links`).
- Invite-код 7 символов → RPC `accept_family_invite` → `status=active`.
- Email + пароль, один экран онбординга роли (без Face ID как обязательного шага).
- Acceptance: 2 браузера, 2 аккаунта, связь по коду; без связи нет чужих данных.

### Sprint B — Alert engine backend (P1 ядро) ✅ (fast-track с C)
- Таблицы/статусы: CREATED → COUNTDOWN → CANCELLED | CONFIRMED → NOTIFIED → ACKNOWLEDGED → RESOLVED.
- Типы: MANUAL_EMERGENCY, MISSED_MEDICATION, FALL_DETECTED (stub-ready), INACTIVITY, … 
- API/Edge: create, cancel, confirm, escalate; idempotency по alert_id.
- Countdown UI на elderly: «Вы в порядке?» / «Нужна помощь» / таймер; cancel/confirm пишут в backend.
- Offline честно: «нет сети, онлайн-уведомления недоступны»; различать local vs server-ack.
- Acceptance: без cancel → статус CONFIRMED в DB; повторный POST не шлёт 5 нотификаций.

### Sprint C — Realtime + Web Push (P1 демо для жюри) ✅ (fast-track с B)
- Realtime подписка guardian на alerts своего elderly.
- Push: permission → subscription → push_subscriptions; Edge send-push с **реальным** web-push + VAPID (private только server).
- Guardian UI: экран тревоги + история; кнопки открыть / позвонить (tel:).
- Demo script: Device A elderly SOS → countdown → timeout → Device B push + realtime.
- Acceptance: **12 пунктов §33** проходят на двух реальных устройствах (Android Chrome обязательно).

### Sprint D — Medication escalation (P2) ✅
- После reminder: Принял / Позже; без ответа → warning → опционально alert по severity LOW/MEDIUM/HIGH.
- Sync intakes через DB (не только localStorage).

### Sprint E — Product redesign dashboard (P2 + §2–3) ✅
- Dashboard elderly: приветствие, статус «всё в порядке», карточки Лекарства / SOS / Память / Состояние.
- Guardian dashboard: статус, пропуски, история тревог.
- Единый стиль: calm/minimal/professional + accessibility; продолжить DESIGN.md clay без градиент-спама.

### Sprint F — Memory card game (P3 + §1) ✅
- Парные карты: easy 3 / mid 6 / hard 8–10 пар; счёт пар/попыток/таймер; restart; end screen; категории.
- Крупные карты, высокий контраст; результаты в game_results / memory_*.

### Sprint G — Sensors (P2, осторожно) ✅
- Fall: DeviceMotion + threshold/debounce/cooldown + permission; иначе «недоступно».
- Night monitoring: architecture + honest copy; detection-модуль pluggable, без меддиагноза.
- Не блокирует демо, если A–C готовы.

### Sprint H — Ship 🟡
- Snooze ingAt/originalDate уже в коде; README/CI ✅; остался точечный CodeRabbit polish по желанию.
- Закрыть CodeRabbit snooze-queue.
- README: два устройства, VAPID, Supabase.
- PR + CI + CodeRabbit; demo checklist для жюри.

## Порядок на ближайшие дни

1. **A → B → C** (без этого ТЗ не выполнено).  
2. Параллельно лёгкий UI polish на countdown/guardian alert экранах.  
3. Затем D + E.  
4. F (игра).  
5. G по остатку времени.

## Definition of Done (главный)

Судья: два телефона, два аккаунта, связаны → Emergency на A → countdown без отмены → push на B (+ realtime если открыт) → запись в истории → без дублей.

## Стек

Vite/React/Tailwind (есть) + Supabase Auth/DB/Realtime/Edge Functions + Web Push (web-push на Edge) + PWA service worker.

## Design mandate (user)
Sprint E redesign MUST browse and apply patterns from: Refero styles, https://21st.dev, https://reactbits.dev (clay/soft UI + senior-friendly). Do not redesign from memory alone.



## Fast track (2026-09-20)
User asked to finish faster + final quick review. Order: merge PR3 → B+C combined → optional D/F → final §33 review. Defer G and deep E until after demo path works. Design sites (Refero/21st/reactbits) still mandatory when E runs.

