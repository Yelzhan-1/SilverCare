# SilverCare — план работ (хакатон)

Обновлено: 2026-09-19 (Asia/Almaty)

> **Статус:** Волна 0 (CodeRabbit/QA долг) и Волна 1 (Claymorphism design system) —
> сделаны в PR `feat/claymorphism-wave0-wave1`. Детали токенов см. `DESIGN.md`.
> Следующая — Волна 2 (парные карточки памяти).

## Источники требований (не путать)

1. **Кейс организаторов:** один главный экран; крупные кнопки; без вкладок/сайдбара; без сложной регистрации; 1-клик подтверждение приёма; цель 0% пропусков; звук + память.
2. **Команда (новые):** claymorphism-дизайн (не вайбкодер); табы убрать; РЕАЛЬНЫЙ SOS→push опекуну + кросс-девайс/БД; игра «парные карточки» как на референсе Алишки.
3. **Уже сделано (PR #1):** sticky confirm, честный snooze, HH:MM, RU media errors, soft memory banner, без MobileFrame и нижнего dock, CI+CodeRabbit.
4. **CodeRabbit (долг):** midnight snooze date, persist ringAt, countdown от ringAt, a11y TimeInput24, wrap баннера/формы/RoleSwitcher.

## Принципы

- Пожилой: **без регистрации**, сразу главный экран.
- Опекун: связка по **invite-коду / простому PIN**, не email-пароль (кейс запрещает сложную регистрацию).
- Один главный экран с крупными кнопками/плитками; настройки/опекун — за дискретным «Ещё».
- Дизайн: Clayomorphism + референсы Refero / 21st.dev / reactbits.dev; WCAG контраст для пожилых.
- Стек: Vite+React+Tailwind; **Supabase** (Postgres+RLS+Realtime+Edge Functions+Web Push VAPID); офлайн-кэш localStorage как fallback.
- Код через **Cursor Claude Sonnet**; после плана — PR; ждать CI+CodeRabbit.

## Что уже есть в репо (фундамент)

- `supabase/migrations/*` — profiles, family_links, medications, emergency_*, push_subscriptions…
- Edge stubs: `send-push`, `emergency-alert`, `family-notification` — **сейчас fake success**, нужна реальная отправка.
- UI: `EmergencyModal` + `emergencyService` countdown; `MemorySuiteModal` / `MemoryGame` — нужно добавить режим **парных карточек** как на скрине.

## Волны (порядок)

### Волна 0 — выравнивание (коротко)
- Подтянуть `main`, почистить остатки табов если всплывут.
- Закрыть CodeRabbit notes (snooze/ringAt/a11y/layout).
- Acceptance: lint/build green; snooze переживает полночь и reload.

### Волна 1 — Design system Clayomorphism
- `DESIGN.md` токены (цвета, тени «глина», радиусы, типографика senior-large).
- Референсы: 21st.dev (clay cards/buttons), reactbits.dev (soft 3D), Refero (senior health apps).
- Перекрасить главный экран, alarm, плитки Память/SOS, memory modal — единый стиль, не generic AI UI.
- Acceptance: desktop+mobile скрины; контраст AA; hit-area кнопок крупные; нет «вайбкодерского» градиент-спама.

### Волна 2 — Парные карточки (референс Алишки)
- Экран/модалка: «ТРЕНИРОВКА ПАМЯТИ» / «ПАРНЫЕ КАРТОЧКИ»; сетка 2×4; рубашка «?» тёмно-зелёная; пары emoji/картинки; «Завершить».
- Доступ с главной плитки «Память» (не вкладка).
- Acceptance: матч 4 пар; крупные карточки; голос/хаптик опционально; закрытие без лома главного сценария.

### Волна 3 — Supabase wiring + pairing
- Подключить реальный Supabase project (env из `.env.example`).
- Применить migrations; RLS.
- Pairing: опекун вводит invite-код пожилого → `family_links.active`.
- Realtime/sync приёмов между устройствами.
- Acceptance: два браузера/два устройства видят один статус приёма; без сложного signup.

### Волна 4 — РЕАЛЬНЫЙ emergency push (критично для жюри)
- PWA + service worker + Web Push permission на телефоне опекуна.
- Сохранять `push_subscriptions` в БД.
- Дописать Edge Function `emergency-alert`/`send-push`: реальная VAPID-отправка (не stub).
- Флоу: SOS / таймер не отменён → событие в БД → Edge Function → **push на телефон опекуна** (звук/вибрация).
- Demo-режим для жюри: «симулировать истечение таймера за N сек» + видимый лог «push sent».
- Acceptance: на втором устройстве (телефон опекуна) приходит системный push; в UI пожилого видно «уведомлены близкие»; запись в `emergency_events`.

### Волна 5 — polish & ship
- Demo script для жюри (1 экран → принять → память-пары → SOS→push).
- README: как поднять Supabase + VAPID.
- PR + CI + CodeRabbit.

## Скиллы / помогаторы (рекомендуемые)

Уже есть у нас:
- Addy Osmani pack: `planning-and-task-breakdown`, `frontend-ui-engineering`, `incremental-implementation`, `constraint-driven-development`, `shipping-and-launch`.

Поставить / использовать в Cursor:
- https://github.com/supabase/agent-skills — официальный Supabase skill (+ postgres best practices).
- https://github.com/Eldergenix/SUPER-DESIGN — design tokens + WCAG gates (хорошо стыкуется с clay + accessibility).
- 21st.dev agent MCP/skills: https://21st.dev/mcp.md , https://21st.dev/.well-known/skills/index.json
- Референс-реализации push: паттерны Edge Function `push-dispatch` (Web Push + VAPID), как в PWA+Supabase проектах.

## Вне скоупа сейчас
- Сложный email/пароль signup.
- Нижний tab bar.
- SMS/звонки Twilio — только если останется время после Web Push.

## Следующий шаг после approve плана
Волна 0+1 промпт в Cursor (Claude), параллельно завести Supabase project + VAPID keys для волны 3–4.
