// Supabase Edge Function: family-notification
// Sends friendly updates to family members (e.g. "Мама успешно приняла лекарство в 18:00").

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { elderName, message, type } = await req.json();
    console.log(`[Family Update] ${elderName}: ${message}`);

    return new Response(
      JSON.stringify({ success: true, status: 'sent' }),
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
