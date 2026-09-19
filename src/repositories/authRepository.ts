/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { generateInviteCode, normalizeInviteCode } from '../utils/inviteCode';
import type { Tables } from '../types/database.types';

export type AppRole = 'elderly' | 'caregiver';

export type ProfileRow = Tables<'profiles'>;
export type ElderlyProfileRow = Tables<'elderly_profiles'>;
export type CaregiverProfileRow = Tables<'caregiver_profiles'>;
export type FamilyLinkRow = Tables<'family_links'>;

export interface LinkedElderInfo {
  elderlyProfileId: string;
  displayName: string;
}

/**
 * Thin data-access layer over Supabase Auth + the profiles/elderly_profiles/
 * caregiver_profiles/family_links tables. All authorization is enforced by
 * Postgres RLS (see supabase/migrations/004_sprint_a_auth_pairing_security.sql)
 * — this file never uses a service-role key and never bypasses RLS itself.
 */
export const authRepository = {
  // ---- Session -----------------------------------------------------------

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => data.subscription.unsubscribe();
  },

  async signUp(email: string, password: string): Promise<{ session: Session | null; user: User | null }> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { session: data.session, user: data.user };
  },

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Не удалось выполнить вход: сессия не создана.');
    return data.session;
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // ---- Profiles ------------------------------------------------------------

  /** Returns the caller's own profiles row, or null if onboarding hasn't run yet. */
  async getMyProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Onboarding step: creates the base profile (id MUST equal auth.uid() —
   * enforced by the "Users can access own profile" RLS policy's WITH CHECK)
   * together with the role-specific sub-profile, in one go.
   */
  async completeOnboarding(params: {
    userId: string;
    role: AppRole;
    displayName: string;
  }): Promise<ProfileRow> {
    const { userId, role, displayName } = params;

    // Retry-safe: if a previous attempt created the profile but failed on the
    // sub-profile insert, reuse the existing row instead of erroring on unique.
    let profile = await authRepository.getMyProfile(userId);
    if (!profile) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .insert({ id: userId, role, display_name: displayName })
        .select('*')
        .single();
      if (profileError) throw profileError;
      profile = data;
    }

    if (role === 'elderly') {
      const existing = await authRepository.getMyElderlyProfile(userId);
      if (!existing) {
        const { error } = await supabase.from('elderly_profiles').insert({ profile_id: userId });
        if (error && error.code !== '23505') throw error;
      }
    } else {
      const existing = await authRepository.getMyCaregiverProfile(userId);
      if (!existing) {
        const { error } = await supabase
          .from('caregiver_profiles')
          .insert({ profile_id: userId, relationship: 'relative' });
        if (error && error.code !== '23505') throw error;
      }
    }

    return profile;
  },

  async getMyElderlyProfile(userId: string): Promise<ElderlyProfileRow | null> {
    const { data, error } = await supabase
      .from('elderly_profiles')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getMyCaregiverProfile(userId: string): Promise<CaregiverProfileRow | null> {
    const { data, error } = await supabase
      .from('caregiver_profiles')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // ---- Invite pairing --------------------------------------------------

  /**
   * Elder side: returns the current pending invite code if one exists,
   * otherwise mints a new one (retrying on the rare invite_code collision,
   * since it's a UNIQUE column). Safe to call repeatedly (e.g. every time
   * the elder reopens "Пригласить опекуна") — it won't create duplicates
   * while a pending invite is still unclaimed.
   */
  async getOrCreatePendingInvite(elderlyProfileId: string): Promise<FamilyLinkRow> {
    const { data: existing, error: existingError } = await supabase
      .from('family_links')
      .select('*')
      .eq('elderly_profile_id', elderlyProfileId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return existing;

    // Try a few times in case of a (very unlikely) invite_code collision.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('family_links')
        .insert({
          elderly_profile_id: elderlyProfileId,
          invite_code: generateInviteCode(),
          status: 'pending',
        })
        .select('*')
        .single();
      if (!error) return data;
      lastError = error;
      // Postgres unique_violation — regenerate and retry.
      if ((error as { code?: string }).code !== '23505') break;
    }
    throw lastError ?? new Error('Не удалось создать код приглашения.');
  },

  /** Elder side: all family links for this elder (to show link status/history). */
  async getFamilyLinksForElder(elderlyProfileId: string): Promise<FamilyLinkRow[]> {
    const { data, error } = await supabase
      .from('family_links')
      .select('*')
      .eq('elderly_profile_id', elderlyProfileId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /**
   * Caregiver side: redeems an invite code via the accept_family_invite()
   * RPC (SECURITY DEFINER). This is the ONLY way a caregiver can claim a
   * pending invite — there is no client-side SELECT-by-code path, so a
   * caregiver can never browse or guess other elders' pending invites.
   */
  async acceptInviteCode(rawCode: string): Promise<string> {
    const code = normalizeInviteCode(rawCode);
    if (!code) throw new Error('Введите код приглашения.');

    const { data, error } = await supabase.rpc('accept_family_invite', {
      p_invite_code: code,
    });
    if (error) throw error;
    const elderName = data?.[0]?.elder_display_name;
    if (!elderName) throw new Error('Код принят, но не удалось получить имя подопечного.');
    return elderName;
  },

  /** Caregiver side: who am I currently linked to (if anyone)? */
  async getLinkedElderForCaregiver(caregiverProfileId: string): Promise<LinkedElderInfo | null> {
    const { data: link, error: linkError } = await supabase
      .from('family_links')
      .select('elderly_profile_id, accepted_at')
      .eq('caregiver_profile_id', caregiverProfileId)
      .eq('status', 'active')
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (linkError) throw linkError;
    if (!link) return null;

    const { data: elderly, error: elderlyError } = await supabase
      .from('elderly_profiles')
      .select('id, profile_id')
      .eq('id', link.elderly_profile_id)
      .maybeSingle();
    if (elderlyError) throw elderlyError;
    if (!elderly) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', elderly.profile_id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return null;

    return { elderlyProfileId: elderly.id, displayName: profile.display_name };
  },
};
