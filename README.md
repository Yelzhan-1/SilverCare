# SilverCare

Простое приложение напоминаний о лекарствах и тренировки памяти для пожилых людей, с
панелью для опекуна (родственника). Vite + React 19 + Tailwind v4.

## Быстрый старт

```bash
npm install
cp .env.example .env   # заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run dev
```

`.env` в git не коммитится (см. `.gitignore`). Используйте **anon/publishable** ключ —
никогда не кладите `service_role`/секретные ключи во frontend.

```bash
npm run lint   # tsc --noEmit
npm run build  # vite build
```

## Аккаунты, роли и связь опекун↔подопечный (Sprint A)

С этого спринта в приложении настоящий Supabase Auth (email + пароль) вместо
локального переключателя ролей. Схема:

1. **Регистрация/вход** — экран `AuthScreen` (email + пароль, минимум 6 символов).
2. **Онбординг роли** (один экран) — после первого входа: имя + выбор
   «Я пользуюсь SilverCare» (elderly) или «Я родственник/опекун» (caregiver).
   Создаёт строки `profiles` (id = `auth.uid()`), и `elderly_profiles` /
   `caregiver_profiles` соответственно.
3. **Elderly**: сразу получает код приглашения (6-8 символов, например `K7X PQ29`)
   с кнопкой «Скопировать» — создаёт `family_links` со `status='pending'`.
4. **Caregiver**: вводит код → строка `family_links` переходит в `status='active'`,
   `caregiver_profile_id` и `accepted_at` проставляются. Если пропустить этот шаг
   при онбординге, ввести код можно прямо на панели опекуна (карточка сверху).
5. Дальше роутинг: elderly → `TodayScreen`, caregiver → `CaregiverDashboardScreen`
   (показывает «Связаны с <имя>» либо форму ввода кода).
   Код можно снова скопировать с плитки «Семья» на главном экране подопечного
   (настоящий `family_links.invite_code`, не заглушка).

### Демо на двух аккаунтах

Проще всего — два разных браузера (или обычное окно + окно в режиме инкогнито),
чтобы у каждого была своя сессия Supabase:

1. **Окно 1 (подопечный)**: откройте приложение → «Регистрация» →
   `mama@example.com` / пароль → имя «Анна Ивановна» → «Я пользуюсь SilverCare» →
   скопируйте код приглашения → «Готово, перейти в приложение».
2. **Окно 2 (опекун)**: «Регистрация» → `son@example.com` / пароль → имя «Алексей» →
   «Я родственник / опекун» → вставьте код из шага 1 → «Подключиться» → увидите
   «Вы связаны с Анна Ивановна».
3. Убедитесь, что панель опекуна показывает связь, а без верного кода (или из
   третьего, несвязанного аккаунта) чужие данные недоступны — это гарантирует
   Row Level Security на стороне базы, а не проверка во фронтенде.

Чтобы переключаться между аккаунтами в одном окне: откройте дискретное меню
«Ещё» (иконка ⚙ в шапке главного экрана пожилого / кнопка «🛠️ Демо» на панели
опекуна) → «Выйти» внизу списка, затем войдите под другим аккаунтом.

Если после регистрации появляется «Проверьте почту» — в проекте включено
подтверждение email. Для живого демо жюри удобнее выключить Confirm email в
Supabase Dashboard → Authentication → Providers → Email.

### Безопасность связывания (важно для ревью)

Изначально в базе была политика `family_links`, разрешавшая **любому**
аутентифицированному (и фактически анонимному — политика не имела `TO`)
пользователю читать/менять **все** ожидающие приглашения (`OR status = 'pending'`).
Это утечка кода приглашения и структуры семьи чужих аккаунтов. Исправлено в
[`supabase/migrations/004_sprint_a_auth_pairing_security.sql`](supabase/migrations/004_sprint_a_auth_pairing_security.sql):

- Политика `family_links` для caregiver теперь показывает **только его
  собственные** (уже принятые) связи.
- Принятие кода происходит **только** через RPC `accept_family_invite(code)` —
  `SECURITY DEFINER`-функция, которая сама проверяет, что вызывающий владеет
  профилем опекуна, ищет ровно одну строку по точному коду (`FOR UPDATE`, без
  гонки при одновременном использовании кода) и не даёт прочитать чужие
  ожидающие приглашения через обычный `SELECT`.
- `is_linked_caregiver()` и `accept_family_invite()` получили `SET search_path
  = public` (защита от search_path hijacking) и `EXECUTE` только для
  `authenticated` (не `anon`).
- Добавлены read-политики, позволяющие связанному опекуну видеть `display_name`
  и `elderly_profiles` подопечного (иначе показать «Связаны с …» было бы нечем).

### Известные ограничения (не в скоупе Sprint A)

- `daily_plans`, `daily_tasks`, `emergency_settings`, `medication_schedules`,
  `memory_results`, `memory_sessions`, `schedules`, `voice_profiles` — RLS
  включён, но политик ещё нет (таблицы полностью недоступны). Текущий UI их не
  использует (данные лекарств/памяти пока в localStorage), поэтому это
  сознательно отложено до спринта, который реально подключит эти данные к
  Supabase.
- Редизайн продукта и парная игра памяти — следующие спринты (см. `tasks/plan.md`).

## SOS, Realtime и Web Push (Sprint B+C)

Цепочка: **SOS на телефоне подопечного → 15 с «Вы в порядке?» → отмена или timeout → строка в `emergency_events` → Realtime у опекуна + Web Push**.

Это не вызов скорой. Без сети UI честно пишет «онлайн-уведомления недоступны».

### Руками: ключи VAPID

1. Сгенерируйте пару (один раз):

```bash
npx web-push generate-vapid-keys
```

2. Публичный ключ — в `.env` (только public):

```
VITE_VAPID_PUBLIC_KEY=BHxxxxxxxx
```

3. Секреты Edge (Dashboard → Edge Functions → Secrets **или** CLI):

```bash
npx supabase secrets set VAPID_PUBLIC_KEY=BHxxxxxxxx --project-ref oyinjdprggupasmtkzoh
npx supabase secrets set VAPID_PRIVATE_KEY=xxxxxxxx --project-ref oyinjdprggupasmtkzoh
npx supabase secrets set VAPID_SUBJECT=mailto:you@example.com --project-ref oyinjdprggupasmtkzoh
```

`VAPID_PRIVATE_KEY` никогда не кладите в Vite / git / frontend.

4. Если после регистрации видите «Проверьте почту» — выключите Confirm email в Auth для демо.

### Демо на двух телефонах (§33)

Android Chrome предпочтителен (Web Push). Два аккаунта уже связаны по коду из Sprint A.

1. **Телефон A (подопечный)** — войдите, главный экран, SOS / «Помощь».
2. Экран **«Вы в порядке?»**, таймер 15 с. «Я В ПОРЯДКЕ» → `cancelled`. Без ответа или «НУЖНА ПОМОЩЬ» → `confirmed` → Edge `emergency-alert` → `notified`.
3. **Телефон B (опекун)** — войдите, разрешите уведомления. Карточка «Тревоги подопечного» обновится через Realtime; если вкладка закрыта — придёт Web Push (после шага с VAPID).
4. Повторный confirm того же `event_id` **не** шлёт пачку пушей: Edge обновляет статус атомарно.

Демо-панель «Ещё → Демо для жюри → Таймер 15 сек» на аккаунте подопечного запускает тот же backend-flow.

## Структура

- `src/lib/supabaseClient.ts` — единственная точка создания Supabase-клиента
  (из `import.meta.env`, anon-ключ).
- `src/repositories/authRepository.ts` — вся работа с Auth/`profiles`/
  `elderly_profiles`/`caregiver_profiles`/`family_links`.
- `src/components/auth/` — `AuthScreen`, `RoleOnboardingScreen`.
- `src/repositories/alertRepository.ts` — RPC create/cancel/confirm + Edge dispatch.
- `supabase/functions/emergency-alert` и `send-push` — реальный Web Push (VAPID private только в Edge secrets).
- `supabase/migrations/` — 001–003 схема; 004–005 Sprint A; 006 Sprint B+C alerts.
- `DESIGN.md` — токены claymorphism-дизайна.
- `tasks/plan.md` — полный план спринтов.

## Документы для команды

- [Описание](docs/ABOUT.md)
- [Гайд и сценарий презентации](docs/TEAM-GUIDE.md)
- Демо-логины: локально `Desktop/SilverCare-DEMO.txt` (не в репозитории)
