import api from '../lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' &&
    'PushManager' in window &&
    'serviceWorker' in navigator;
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Request permission and subscribe to push. Call after user is logged in.
 * Uses API_BASE_URL for vapid-key (no auth) and for subscribe (auth via axios elsewhere).
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (Notification.permission === 'denied') return false;

  try {
    const vapidRes = await fetch(`${API_BASE_URL}/push/vapid-key`);
    if (!vapidRes.ok) return false;
    const { vapidPublicKey } = await vapidRes.json();
    if (!vapidPublicKey) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    const json = subscription.toJSON();
    const body = {
      endpoint: json.endpoint,
      keys: json.keys as { p256dh: string; auth: string },
    };

    await api.post('/push/subscribe', body);
    return true;
  } catch {
    return false;
  }
}

/**
 * Unsubscribe from push and remove subscription on server.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.delete('/push/unsubscribe', { data: { endpoint: subscription.endpoint } });
    }
  } catch {
    // ignore
  }
}
