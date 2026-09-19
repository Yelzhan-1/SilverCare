/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';

const DEVICE_ID_KEY = 'silvercare:push-device-id';

function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch (err) {
    console.warn('Service worker registration failed', err);
    return null;
  }
}

export async function subscribeCaregiverPush(profileId: string): Promise<'ok' | 'denied' | 'unsupported' | 'no-vapid'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapid) return 'no-vapid';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await registerServiceWorker();
  if (!registration) return 'unsupported';

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Неполные ключи Web Push.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      profile_id: profileId,
      device_id: getDeviceId(),
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;
  return 'ok';
}
