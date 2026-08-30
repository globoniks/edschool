import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const findUniqueUser = vi.fn();
const findFirstParent = vi.fn();

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    parent: { findFirst: (...args: unknown[]) => findFirstParent(...args) },
  },
}));

const { authenticate } = await import('../src/middleware/auth.middleware.js');
const { fakeRequest, runMiddleware } = await import('./helpers.js');

const SECRET = 'test-secret-that-is-long-enough-for-testing';
process.env.JWT_SECRET = SECRET;

/** Sign a token whose `iat` we control, so token-age rules can be exercised. */
const signAt = (issuedAtSeconds: number, claims: Record<string, unknown> = {}) =>
  jwt.sign(
    { id: 'u1', email: 'user@test.local', role: 'TEACHER', schoolId: 'school-1', iat: issuedAtSeconds, ...claims },
    SECRET
  );

const withToken = (token: string) =>
  fakeRequest({ headers: { authorization: `Bearer ${token}` } });

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'user@test.local',
  role: 'TEACHER',
  schoolId: 'school-1',
  isActive: true,
  passwordChangedAt: null,
  userTags: [],
  school: { id: 'school-1' },
  ...overrides,
});

const NOW = Math.floor(Date.now() / 1000);

describe('authenticate', () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
    findFirstParent.mockReset();
  });

  it('rejects a request with no Authorization header', async () => {
    const result = await runMiddleware(authenticate, fakeRequest());
    expect(result.error?.statusCode).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: 'u1', role: 'SUPER_ADMIN' }, 'not-the-real-secret');
    const result = await runMiddleware(authenticate, withToken(forged));
    expect(result.error?.statusCode).toBe(401);
    expect(result.error?.message).toBe('Invalid token');
  });

  it('rejects a valid token whose user no longer exists', async () => {
    findUniqueUser.mockResolvedValue(null);
    const result = await runMiddleware(authenticate, withToken(signAt(NOW)));
    expect(result.error?.statusCode).toBe(401);
  });

  it('rejects a deactivated user even with a valid token', async () => {
    findUniqueUser.mockResolvedValue(dbUser({ isActive: false }));
    const result = await runMiddleware(authenticate, withToken(signAt(NOW)));
    expect(result.error?.statusCode).toBe(401);
  });

  it('attaches the resolved user and permissions on success', async () => {
    findUniqueUser.mockResolvedValue(dbUser());
    const req = withToken(signAt(NOW));
    const result = await runMiddleware(authenticate, req);

    expect(result.passed).toBe(true);
    expect(req.user?.id).toBe('u1');
    expect(req.user?.role).toBe('TEACHER');
    // Permissions come from the database record, never from the token body.
    expect(req.user?.permissions).toContain('enterMarks');
  });

  it('ignores role and schoolId claims in the token, trusting only the database', async () => {
    // A token whose payload claims SUPER_ADMIN must not escalate: the record
    // in the database is the authority.
    findUniqueUser.mockResolvedValue(dbUser({ role: 'TEACHER', schoolId: 'school-1' }));
    const req = withToken(signAt(NOW, { role: 'SUPER_ADMIN', schoolId: 'other-school' }));
    await runMiddleware(authenticate, req);

    expect(req.user?.role).toBe('TEACHER');
    expect(req.user?.schoolId).toBe('school-1');
  });

  describe('password-change revocation', () => {
    it('rejects a token issued before the password changed', async () => {
      findUniqueUser.mockResolvedValue(
        dbUser({ passwordChangedAt: new Date((NOW - 10) * 1000) })
      );
      const result = await runMiddleware(authenticate, withToken(signAt(NOW - 60)));
      expect(result.error?.statusCode).toBe(401);
      expect(result.error?.message).toMatch(/session expired/i);
    });

    it('rejects a token issued in the SAME second as the password change', async () => {
      // Regression guard: `iat` only has second resolution, so a strict `<`
      // comparison let a token minted in the same second as the change survive.
      const sameSecond = NOW - 5;
      findUniqueUser.mockResolvedValue(
        // 900ms into that second — floors to exactly `sameSecond`.
        dbUser({ passwordChangedAt: new Date(sameSecond * 1000 + 900) })
      );
      const result = await runMiddleware(authenticate, withToken(signAt(sameSecond)));
      expect(result.error?.statusCode).toBe(401);
    });

    it('accepts a token issued after the password changed', async () => {
      findUniqueUser.mockResolvedValue(
        dbUser({ passwordChangedAt: new Date((NOW - 60) * 1000) })
      );
      const result = await runMiddleware(authenticate, withToken(signAt(NOW)));
      expect(result.passed).toBe(true);
    });

    it('accepts any token when the password has never been changed', async () => {
      findUniqueUser.mockResolvedValue(dbUser({ passwordChangedAt: null }));
      const result = await runMiddleware(authenticate, withToken(signAt(NOW - 99999)));
      expect(result.passed).toBe(true);
    });
  });

  describe('parent accounts', () => {
    it('rejects a parent with no linked children', async () => {
      findUniqueUser.mockResolvedValue(dbUser({ role: 'PARENT' }));
      findFirstParent.mockResolvedValue({ id: 'p1', students: [] });

      const result = await runMiddleware(authenticate, withToken(signAt(NOW, { role: 'PARENT' })));
      expect(result.error?.statusCode).toBe(403);
    });

    it('rejects a parent with no parent profile', async () => {
      findUniqueUser.mockResolvedValue(dbUser({ role: 'PARENT' }));
      findFirstParent.mockResolvedValue(null);

      const result = await runMiddleware(authenticate, withToken(signAt(NOW, { role: 'PARENT' })));
      expect(result.error?.statusCode).toBe(404);
    });

    it('allows a parent with at least one linked child', async () => {
      findUniqueUser.mockResolvedValue(dbUser({ role: 'PARENT' }));
      findFirstParent.mockResolvedValue({ id: 'p1', students: [{ id: 's1' }] });

      const result = await runMiddleware(authenticate, withToken(signAt(NOW, { role: 'PARENT' })));
      expect(result.passed).toBe(true);
    });
  });
});
