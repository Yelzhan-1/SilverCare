/**
 * Shared senior-friendly field/button classes for Auth + onboarding.
 * Tokens only — see DESIGN.md. Interactive states: hover, focus-visible,
 * active, disabled; buttons also cover loading via aria-busy / disabled.
 */

export const AUTH_FIELD =
  'w-full min-h-14 h-14 px-4 text-base font-semibold rounded-clay-md bg-clay-surface-sunken text-clay-ink ' +
  'border border-black/[0.04] hover:brightness-[0.98] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ' +
  'disabled:opacity-60 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:outline aria-[invalid=true]:outline-[3px] aria-[invalid=true]:outline-clay-danger';

export const AUTH_PRIMARY_BTN =
  'clay-tap w-full min-h-14 h-14 bg-clay-primary hover:brightness-105 active:brightness-95 ' +
  'disabled:opacity-60 disabled:pointer-events-none ' +
  'text-white text-lg font-bold rounded-clay-md shadow-clay-primary ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ' +
  'transition-[filter,opacity,transform] cursor-pointer';

export const AUTH_SECONDARY_BTN =
  'clay-tap w-full min-h-12 h-12 bg-clay-surface-sunken hover:brightness-[0.98] active:brightness-95 ' +
  'text-clay-ink font-bold rounded-clay-md ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ' +
  'disabled:opacity-60 disabled:pointer-events-none cursor-pointer';
