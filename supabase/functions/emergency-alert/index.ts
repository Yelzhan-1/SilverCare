import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { configureVapid, sendWebPush } from '../_shared/webpush.ts';

interface EmergencyPayload {
  eventId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const payload = (await req.json()) as EmergencyPayload;
    if (!payload?.eventId) {
      return jsonResponse({ error: 'eventId is required' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existing, error: loadError } = await admin
      .from('emergency_events')
      .select('id, elderly_profile_id, status, type')
      .eq('id', payload.eventId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!existing) return jsonResponse({ error: 'Alert not found' }, 404);

    const { data: elder } = await admin
      .from('elderly_profiles')
      .select('id, profile_id')
      .eq('id', existing.elderly_profile_id)
      .maybeSingle();

    const isElder = elder?.profile_id === userData.user.id;
    // Service role bypasses auth.uid() inside is_linked_caregiver — check family_links directly.
    const { data: caregiverRow } = await admin
      .from('caregiver_profiles')
      .select('id')
      .eq('profile_id', userData.user.id)
      .maybeSingle();
    let isLinkedCaregiver = false;
    if (caregiverRow) {
      const { data: link } = await admin
        .from('family_links')
        .select('id')
        .eq('elderly_profile_id', existing.elderly_profile_id)
        .eq('caregiver_profile_id', caregiverRow.id)
        .eq('status', 'active')
        .maybeSingle();
      isLinkedCaregiver = Boolean(link);
    }

    if (!isElder && !isLinkedCaregiver) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    if (['notified', 'acknowledged', 'resolved'].includes(existing.status)) {
      return jsonResponse({ success: true, alreadyNotified: true, delivered: 0, status: existing.status });
    }

    const { data: notified, error: updateError } = await admin
      .from('emergency_events')
      .update({ status: 'notified', notified_at: new Date().toISOString() })
      .eq('id', payload.eventId)
      .in('status', ['confirmed', 'countdown'])
      .select('id, status')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!notified) {
      return jsonResponse({ success: true, alreadyNotified: true, delivered: 0 });
    }

    const { data: links } = await admin
      .from('family_links')
      .select('caregiver_profile_id')
      .eq('elderly_profile_id', existing.elderly_profile_id)
      .eq('status', 'active');

    const caregiverProfileIds = (links ?? [])
      .map((row) => row.caregiver_profile_id)
      .filter((id): id is string => Boolean(id));

    if (caregiverProfileIds.length === 0) {
      return jsonResponse({ success: true, alreadyNotified: false, delivered: 0, status: 'notified' });
    }

    const { data: caregivers } = await admin
      .from('caregiver_profiles')
      .select('id, profile_id')
      .in('id', caregiverProfileIds);
    const profileIds = (caregivers ?? []).map((c) => c.profile_id);

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('profile_id', profileIds);

    const { data: elderProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', elder?.profile_id ?? '')
      .maybeSingle();

    const title = 'SilverCare: нужна помощь';
    const body = `${elderProfile?.display_name || 'Подопечный'} нажал SOS. Откройте приложение.`;

    let delivered = 0;
    if ((subs ?? []).length > 0) {
      configureVapid();
      for (const sub of subs ?? []) {
        try {
          await sendWebPush(sub, { title, body, url: '/', tag: `alert-${payload.eventId}` });
          delivered += 1;
        } catch (err) {
          console.error('[emergency-alert] push failed', (err as Error).message);
        }
      }
    }

    return jsonResponse({
      success: true,
      alreadyNotified: false,
      delivered,
      status: 'notified',
    });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 400);
  }
});
