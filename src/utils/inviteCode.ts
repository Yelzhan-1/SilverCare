/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Excludes visually-ambiguous characters (0/O, 1/I/L) so a code read aloud
// or copied by an elderly user onto a caregiver's phone is easy to get right.
const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 7;

/** Generates a random 7-character, senior-friendly invite code (e.g. "K7XPQ29"). */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)];
  }
  return code;
}

/** Normalizes user-typed invite codes before comparing/sending to the server. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}

/** Splits a code into 3-4 char groups for a more readable display, e.g. "K7X PQ29". */
export function formatInviteCodeForDisplay(code: string): string {
  const clean = normalizeInviteCode(code);
  if (clean.length <= 4) return clean;
  const mid = Math.ceil(clean.length / 2);
  return `${clean.slice(0, mid)} ${clean.slice(mid)}`;
}
