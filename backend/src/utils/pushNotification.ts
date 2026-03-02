import webpush from 'web-push';
import { prisma } from '../lib/prisma.js';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@edumapping.com';

let vapidInitialized = false;

function ensureVapid() {
  if (!vapidInitialized) {
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
      vapidInitialized = true;
    }
  }
  return vapidInitialized;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Send push to all subscriptions for one user. Fire-and-forget; removes stale subscriptions on 410.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return;

  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const payloadStr = JSON.stringify(payload);

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.deleteMany({
            where: { id: sub.id },
          });
        }
      }
    }
  } catch {
    // Don't throw; push is best-effort
  }
}

/**
 * Send push to multiple users. Fire-and-forget.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!ensureVapid() || userIds.length === 0) return;

  const unique = [...new Set(userIds)];
  await Promise.all(unique.map((id) => sendPushToUser(id, payload)));
}

/**
 * Send push to all users of a given role in a school (e.g. PARENTS for announcements).
 */
export async function sendPushToSchoolRole(
  schoolId: string,
  role: string,
  payload: PushPayload
): Promise<void> {
  if (!ensureVapid()) return;

  try {
    const users = await prisma.user.findMany({
      where: { schoolId, role: role as any, isActive: true },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await sendPushToUsers(userIds, payload);
  } catch {
    // Don't throw
  }
}

/**
 * Send push to all active users in a school.
 */
export async function sendPushToSchool(schoolId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return;

  try {
    const users = await prisma.user.findMany({
      where: { schoolId, isActive: true },
      select: { id: true },
    });
    await sendPushToUsers(users.map((u) => u.id), payload);
  } catch {
    // Don't throw
  }
}
