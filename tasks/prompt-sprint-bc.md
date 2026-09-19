FAST TRACK — Sprint B+C together (hackathon speed). Claude Sonnet.
Repo: C:\Users\TRXpc\Desktop\SilverCare
Branch from latest main (после merge PR #3): feat/sprint-bc-alerts-push
Skills: .agents/skills/supabase (+ postgres-best-practices). Читай перед SQL/Edge.

GOAL (ТЗ §6–9, §14–20, §25–26, §33)
Реальная тревога на 2 устройствах:
Elderly SOS → countdown UI → cancel ИЛИ timeout confirm → запись в DB → Realtime у Guardian + Web Push на телефон Guardian.
NO fake localStorage sync. NO «скорая вызвана». VAPID private только на Edge/server.

УЖЕ ЕСТЬ
- Auth + roles + invite (Sprint A)
- emergency_events table + local emergencyService UI
- Stub Edge: send-push, emergency-alert (переписать на реально)
- Project: oyinjdprggupasmtkzoh / .env с anon URL

SPRINT B — Alert engine
1. Расширить emergency_events (или alerts) под статусы: created/countdown/cancelled/confirmed/notified/acknowledged/resolved + type (manual_sos минимум; missed_medication опционально заглушкой).
2. Edge или RPC: create_alert, cancel_alert, confirm_alert (idempotent по alert_id).
3. Elderly UI: огромный экран «Вы в порядке?» + Я В ПОРЯДКЕ / НУЖНА ПОМОЩЬ + countdown 15с; все действия пишут в backend; offline → честное «нет сети».
4. Guardian: список/карточка активной тревоги + история (из DB).
5. Не дублировать push 5 раз при повторном confirm.

SPRINT C — Realtime + Push
1. Realtime subscribe guardian на alerts своего elderly (через family_links).
2. PWA/service worker минимум для Web Push; Guardian регистрирует subscription → push_subscriptions.
3. Edge send-push: реальный web-push с VAPID (private в Edge secrets: VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT). Public в VITE_VAPID_PUBLIC_KEY.
4. На confirm/timeout: update DB + invoke push to linked caregivers + realtime.
5. README: как сгенерировать VAPID, положить secrets, демо на 2 телефонах (Android Chrome предпочтительно).
6. Demo control: кнопка/панель для жюри «запустить SOS countdown» уже есть — подключи к backend flow.

VERIFY
- npm run lint && npm run build
- Тест §33 насколько возможно в 2 браузерах (инкогнито): timeout → guardian видит realtime; push если подписка есть
- Краткий отчёт что сделано / что нужно руками (VAPID secrets, Confirm email)

DON'T: pair-game, fall detection, night breathing, full redesign (Refero/21st — позже), fake push success без отправки.