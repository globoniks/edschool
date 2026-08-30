/**
 * Build a deep link into the web app for push notifications.
 *
 * These URLs are opened by the service worker as `origin + url`, so they must
 * match the path the SPA is actually served from. They were previously written
 * as hardcoded `/edschool/...` literals, which silently broke every
 * notification click when the app moved to the domain root.
 *
 * Set APP_BASE_PATH (e.g. "/edschool") only if the app is served from a
 * sub-path; it must match the frontend's VITE_BASE_PATH.
 */
const APP_BASE_PATH = (process.env.APP_BASE_PATH ?? '').replace(/\/+$/, '');

export const appUrl = (path: string): string =>
  `${APP_BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;

/**
 * Named destinations, so a route rename is a one-line change here rather than a
 * hunt through the controllers. Parent-facing notifications point at the parent
 * views; anything sent school-wide must use a route every role can open.
 */
export const APP_ROUTES = {
  announcements: '/app/announcements',
  messages: '/app/messages',
  parentAlerts: '/app/parent/alerts',
  parentFees: '/app/parent/fees',
  parentHomework: '/app/parent/homework',
} as const;
