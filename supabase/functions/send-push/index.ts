import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { configureVapid, sendWebPush } from '../_shared/webpush.ts';

interface SendPushBody {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
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

    const payload = (await req.json()) as SendPushBody;
    const title = payload.title || 'SilverCare';
    const body = payload.body || 'Новое уведомление';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subs, error: subError } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, profile_id')
      .eq('profile_id', userData.user.id);
    if (subError) throw subError;

    configureVapid();
    let delivered = 0;
    for (const sub of subs ?? []) {
      try {
        await sendWebPush(sub, { title, body, url: payload.url || '/', tag: payload.tag || 'silvercare' });
        delivered += 1;
      } catch (err) {
        console.error('[send-push] failed', (err as Error).message);
      }
    }

    return jsonResponse({ success: true, delivered, alreadyNotified: false });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 400);
  }
});
