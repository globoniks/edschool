import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL = process.env.APP_BASE_PATH;

/** appUrl reads the env var at module load, so re-import per case. */
async function loadWithBase(base: string | undefined) {
  if (base === undefined) delete process.env.APP_BASE_PATH;
  else process.env.APP_BASE_PATH = base;
  vi.resetModules();
  return import('../src/utils/appUrl.js');
}

describe('appUrl', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.APP_BASE_PATH;
    else process.env.APP_BASE_PATH = ORIGINAL;
  });

  it('returns a root-relative path when no base is configured', async () => {
    const { appUrl } = await loadWithBase(undefined);
    expect(appUrl('/app/parent/alerts')).toBe('/app/parent/alerts');
  });

  it('prefixes a configured sub-path', async () => {
    const { appUrl } = await loadWithBase('/edschool');
    expect(appUrl('/app/parent/alerts')).toBe('/edschool/app/parent/alerts');
  });

  it('never produces a double slash from a trailing-slash base', async () => {
    const { appUrl } = await loadWithBase('/edschool/');
    expect(appUrl('/app/messages')).toBe('/edschool/app/messages');
  });

  it('tolerates a path given without a leading slash', async () => {
    const { appUrl } = await loadWithBase('/edschool');
    expect(appUrl('app/messages')).toBe('/edschool/app/messages');
  });
});

describe('APP_ROUTES point at routes the SPA actually defines', () => {
  it('matches the router paths in frontend/src/App.tsx', async () => {
    const { APP_ROUTES } = await loadWithBase(undefined);

    // These strings are asserted against the real router below; if a route is
    // renamed in App.tsx this test fails rather than silently sending users to
    // a 404 from a notification.
    expect(Object.values(APP_ROUTES)).toEqual([
      '/app/announcements',
      '/app/messages',
      '/app/parent/alerts',
      '/app/parent/fees',
      '/app/parent/homework',
    ]);
  });

  it('every destination exists as a route in App.tsx', async () => {
    const { readFileSync } = await import('fs');
    const { APP_ROUTES } = await loadWithBase(undefined);

    const appTsx = readFileSync(
      new URL('../../frontend/src/App.tsx', import.meta.url),
      'utf8'
    );

    for (const route of Object.values(APP_ROUTES)) {
      // Routes are declared relative to the "/app" parent route.
      const relative = route.replace(/^\/app\//, '');
      expect(appTsx, `no route path="${relative}" found for ${route}`).toContain(
        `path="${relative}"`
      );
    }
  });
});
