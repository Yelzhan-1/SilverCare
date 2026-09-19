# SilverCare — Sprint D + E + F + G (ship, no demo bugs)

Model: **Claude Sonnet 4.6** (thinking on, high effort). Repo: `C:\Users\TRXpc\Desktop\SilverCare`, branch from latest `main`.

## Context
A+B+C already on `main`: auth+invite, SOS countdown/alerts RPCs, Realtime, Web Push (VAPID/Edge deployed). Do **not** regress those.

Read first: `tasks/plan.md`, `DESIGN.md`, `src/features/safety/*`, med reminder code, `src/screens/*`, `supabase/migrations/*`.

## Implement completely

### D — Medication escalation
After reminder: taken / snooze. No response → warning → automatic alert severity LOW / MEDIUM / HIGH.
Use `emergency_events.type = missed_medication`. Sync intakes via Supabase DB (not localStorage-only). Caregiver AlertInbox shows them. Honest RU copy. Never «скорая вызвана».

### E — Redesign (mandatory research)
**Before coding UI:** open and apply patterns from Refero styles, https://21st.dev, https://reactbits.dev (clay/soft + senior a11y). Extend `DESIGN.md` clay tokens.
Elderly: greeting, «всё в порядке», shortcuts meds / SOS / game / wellbeing.
Guardian: link status, misses, alert history.
Huge buttons, high contrast, calm/minimal/professional.

### F — Memory pair game
Easy 3 / mid 6 / hard 8–10 pairs. Sound on/off. Restart, end screen, categories. Huge cards. Persist `game_results` / `memory_*` (migration if needed).

### G — Sensors (honest)
Fall: DeviceMotion + threshold/debounce/cooldown + permission; soft «недоступно» if denied.
Night: architecture + honest non-diagnosis copy; pluggable stub. No medical diagnoses.

## Quality bar
- `npm run lint` && `npm run build` green
- No crashes on auth, SOS, meds, game, caregiver inbox
- Keep SOS 15s countdown, cancel/confirm, Realtime, Web Push, invite pairing
- No secrets in git
- Russian UI
- Prefer correct complete features over half-broken rushes

## Deliver
1. Branch `feat/sprint-defg-ship`
2. Commit with clear message
3. Open PR → `main` with test checklist: D/E/F/G + regression A–C two-role SOS
4. Summarize how to demo each sprint

Plan briefly with Elzhan/Bob only if a product fork is ambiguous; otherwise implement.