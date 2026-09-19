/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when the app has real Supabase credentials configured (via `.env`,
 * copied from `.env.example`). When false, auth/pairing screens show a
 * clear setup message instead of crashing on a blank client.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    '[SilverCare] Supabase is not configured: missing VITE_SUPABASE_URL / ' +
      'VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your ' +
      'project credentials, then restart the dev server.'
  );
}

// NEVER put a service_role / secret key here — this client ships to the
// browser. The anon (publishable) key is safe: every table it can reach is
// gated by Row Level Security policies (see supabase/migrations).
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
