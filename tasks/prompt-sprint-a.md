Ты в C:\Users\TRXpc\Desktop\SilverCare. Ветка от main: feat/sprint-a-auth-pairing. Claude Sonnet.
Skills: .agents/skills/supabase, supabase-postgres-best-practices (читай перед RLS/SQL).
Сначала короткий план по файлам → код → npm run lint && npm run build → краткий отчёт.

УЖЕ ГОТОВО (не пересоздавай проект):
- Supabase project: oyinjdprggupasmtkzoh (eu-central-1)
- URL: https://oyinjdprggupasmtkzoh.supabase.co
- .env уже есть: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (не коммить .env)
- Таблицы + RLS уже накатили. family_links.caregiver_profile_id допускает NULL (pending invite).
- profiles.id должен совпадать с auth.uid() при создании профиля.

ЦЕЛЬ SPRINT A (ТЗ): лёгкий Auth + роли elderly|caregiver + invite-связь через DB (не localStorage).

СДЕЛАТЬ
1. npm i @supabase/supabase-js
2. src/lib/supabaseClient.ts из import.meta.env
3. Auth UI (крупно, senior-friendly, clay tokens если есть): Sign up / Sign in (email+password). После signup создать profiles row с id=auth.uid(), role, display_name.
4. Onboarding role: elderly или caregiver (один экран, большие кнопки). Elderly → elderly_profiles; caregiver → caregiver_profiles.
5. Elderly: генерировать/показать invite_code (короткий читаемый, напр. 6–8 символов), кнопка «Скопировать»; создать family_links status=pending.
6. Caregiver: ввод invite_code → привязка caregiver_profile_id, status=active, accepted_at=now().
7. Роутинг: нет сессии → Auth; elderly → TodayScreen; caregiver → CaregiverDashboard (показать связанного elderly / «введите код»).
8. RLS: доработай политики если signup/invite ломаются (postgres-best-practices). Политика на pending invite: caregiver может SELECT pending по invite_code и UPDATE accept — аккуратно, без утечки чужих данных.
9. README: как логиниться двумя аккаунтами на двух устройствах для демо.
10. Не трогай Web Push / SOS backend / pair-game / полный redesign.

ACCEPTANCE
- Два аккаунта связываются по коду.
- Без связи caregiver не видит чужие medications/emergency.
- lint + build зелёные.
- .env не в git.

DON'T: fake pairing в localStorage; сложный Face ID; нижние табы; service role во frontend.