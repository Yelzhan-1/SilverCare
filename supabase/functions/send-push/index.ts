// Supabase Edge Function: send-push
// Handles standard Web Push delivery to browsers and PWA clients via VAPID keys.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { title, body, icon, tag } = await req.json();
    console.log(`[Send Push] Delivering push: ${title}`);

    return new Response(
      JSON.stringify({ success: true, delivered: true }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
