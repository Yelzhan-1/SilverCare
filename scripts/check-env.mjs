#!/usr/bin/env node
/**
 * Fail-fast check for Vite public env vars that are inlined at BUILD time.
 *
 * Without this, `vite build` succeeds with empty VITE_* vars and the live
 * site shows «Supabase не настроен» / Invalid API key.
 *
 * Loads Vite-style .env files (does not override existing process.env, so
 * Vercel / CI / shell values win). Never prints secret values.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const mode = process.argv.includes('--production') ? 'production' : 'development';

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(filename) {
  const path = resolve(ROOT, filename);
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const trimmed = line.startsWith('export ') ? line.slice(7).trim() : line;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = stripQuotes(trimmed.slice(eq + 1).trim());
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

for (const file of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
  loadEnvFile(file);
}

const PLACEHOLDER_RE =
  /^(your[_-]?|xxx+|todo|changeme|replace(?:me)?|example|dummy|placeholder)/i;

function isBlank(value) {
  return value == null || !String(value).trim();
}

function looksPlaceholder(value) {
  const v = String(value).trim();
  if (PLACEHOLDER_RE.test(v) || /placeholder/i.test(v)) return true;
  try {
    const hostLabel = new URL(v).hostname.split('.')[0];
    if (PLACEHOLDER_RE.test(hostLabel)) return true;
  } catch {
    // not a URL
  }
  return false;
}

function jwtRole(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json).role ?? null;
  } catch {
    return null;
  }
}

const checks = [
  {
    name: 'VITE_SUPABASE_URL',
    hint: 'must be https://<project-ref>.supabase.co',
    ok(raw) {
      if (isBlank(raw) || looksPlaceholder(raw)) return false;
      try {
        const url = new URL(String(raw).trim());
        return url.protocol === 'https:' && /\.supabase\.co$/i.test(url.hostname);
      } catch {
        return false;
      }
    },
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    hint: 'must be a JWT starting with eyJ (anon/publishable — never service_role)',
    ok(raw) {
      if (isBlank(raw) || looksPlaceholder(raw)) return false;
      const v = String(raw).trim();
      if (!v.startsWith('eyJ') || v.split('.').length !== 3 || /\s/.test(v)) {
        return false;
      }
      return jwtRole(v) !== 'service_role';
    },
  },
  {
    name: 'VITE_VAPID_PUBLIC_KEY',
    hint: 'must be the public VAPID key (non-empty)',
    ok(raw) {
      return !isBlank(raw) && !looksPlaceholder(raw);
    },
  },
];

const missing = checks.filter((check) => !check.ok(process.env[check.name]));

if (missing.length === 0) {
  process.exit(0);
}

const lines = missing.map((check) => {
  const raw = process.env[check.name];
  const state = isBlank(raw) ? 'empty / missing' : 'invalid / placeholder';
  return `  ✖ ${check.name} — ${state}\n    ${check.hint}`;
});

console.error(`
[SilverCare] Build aborted: missing or invalid environment variables.

${lines.join('\n\n')}

These Vite vars are inlined at BUILD time. Empty values still let \`vite build\`
succeed, then production shows «Supabase не настроен» / Invalid API key.

Set them in:
  Vercel → Project Settings → Environment Variables
  for Production (and Preview / Development), then Redeploy.

Локально: скопируйте .env.example в .env и заполните значения, затем
перезапустите \`npm run dev\` / \`npm run build\`.
Не коммитьте .env и не кладите service_role во frontend.
`);

process.exit(1);
