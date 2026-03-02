import webPush from 'web-push';
import { prisma } from '../lib/prisma.js';

if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function sendBusNearNotification(
  busId: string,
  stopName: string,
  etaMinutes: number,
): Promise<void> {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      select: {
        busNumber: true,
        routes: {
          where: { isActive: true },
          select: {
            studentTransports: {
              select: {
                student: {
                  select: {
                    parents: {
                      select: {
                        parent: {
                          select: {
                            userId: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bus) return;

    const parentUserIds = new Set<string>();
    for (const route of bus.routes) {
      for (const st of route.studentTransports) {
        for (const ps of st.student.parents) {
          if (ps.parent.userId) parentUserIds.add(ps.parent.userId);
        }
      }
    }

    if (parentUserIds.size === 0) return;

    if (!process.env.VAPID_PUBLIC_KEY) return;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: Array.from(parentUserIds) } },
    });

    const payload = JSON.stringify({
      title: `Bus ${bus.busNumber} nearby`,
      body:
        etaMinutes > 0
          ? `Approaching ${stopName} — ETA ${etaMinutes} min`
          : `Arrived at ${stopName}`,
      icon: '/icons/icon-192x192.png',
      data: { type: 'bus-near', busId },
    });

    const sendPromises = subscriptions.map((sub) =>
      webPush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        )
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
          }
        }),
    );

    await Promise.allSettled(sendPromises);
  } catch (err) {
    console.error('Bus notification error:', err);
  }
}
