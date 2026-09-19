import webpush from 'npm:web-push@3.6.7';

export interface PushKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing Edge secret ${name}`);
  }
  return value;
}

export function configureVapid(): void {
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') || 'mailto:silvercare@example.com',
    requireEnv('VAPID_PUBLIC_KEY'),
    requireEnv('VAPID_PRIVATE_KEY')
  );
}

export async function sendWebPush(
  sub: PushKeys,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify(payload)
  );
}
