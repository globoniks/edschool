import { describe, it, expect } from 'vitest';
import {
  authorize,
  authorizePermissions,
  allowTeacherOrPermission,
  requireSuperAdmin,
} from '../src/middleware/auth.middleware.js';
import { fakeRequest, runMiddleware } from './helpers.js';

const asUser = (role: string, permissions: string[] = [], schoolId = 'school-1') =>
  fakeRequest({
    user: { id: 'u1', email: `${role.toLowerCase()}@test.local`, role, schoolId, permissions },
  });

describe('authorize(...roles)', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const result = await runMiddleware(authorize('SCHOOL_ADMIN'), fakeRequest());
    expect(result.passed).toBe(false);
    expect(result.error?.statusCode).toBe(401);
  });

  it('allows a listed role and rejects an unlisted one with 403', async () => {
    const allowed = await runMiddleware(authorize('TEACHER'), asUser('TEACHER'));
    expect(allowed.passed).toBe(true);

    const denied = await runMiddleware(authorize('TEACHER'), asUser('PARENT'));
    expect(denied.passed).toBe(false);
    expect(denied.error?.statusCode).toBe(403);
  });

  it('does NOT give SUPER_ADMIN an implicit bypass', async () => {
    // authorize() is an exact role match by design — routes that want the
    // bypass list SUPER_ADMIN explicitly. Locking this in so the behaviour
    // can't drift into a silent superuser backdoor.
    const result = await runMiddleware(authorize('DRIVER'), asUser('SUPER_ADMIN'));
    expect(result.passed).toBe(false);
    expect(result.error?.statusCode).toBe(403);
  });
});

describe('authorizePermissions(...keys)', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const result = await runMiddleware(authorizePermissions('manageFees'), fakeRequest());
    expect(result.error?.statusCode).toBe(401);
  });

  it('lets SUPER_ADMIN and SCHOOL_ADMIN through without any permission keys', async () => {
    for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN']) {
      const result = await runMiddleware(authorizePermissions('manageFees'), asUser(role, []));
      expect(result.passed).toBe(true);
    }
  });

  it('passes a SUB_ADMIN holding any one of the required keys', async () => {
    const result = await runMiddleware(
      authorizePermissions('manageFees', 'manageFinance'),
      asUser('SUB_ADMIN', ['manageFinance'])
    );
    expect(result.passed).toBe(true);
  });

  it('rejects a SUB_ADMIN holding only unrelated permissions', async () => {
    const result = await runMiddleware(
      authorizePermissions('manageFees'),
      asUser('SUB_ADMIN', ['manageTransport'])
    );
    expect(result.passed).toBe(false);
    expect(result.error?.statusCode).toBe(403);
  });

  it('rejects a TEACHER without the key — teachers get no blanket pass here', async () => {
    const result = await runMiddleware(
      authorizePermissions('manageFees'),
      asUser('TEACHER', ['enterMarks'])
    );
    expect(result.passed).toBe(false);
    expect(result.error?.statusCode).toBe(403);
  });

  it('rejects a PARENT, who resolves to no permission keys', async () => {
    // getUserPermissions() never grants a PARENT any key (see permissions.test),
    // so the realistic case is an empty list, and that must be denied.
    const result = await runMiddleware(authorizePermissions('manageFees'), asUser('PARENT', []));
    expect(result.passed).toBe(false);
    expect(result.error?.statusCode).toBe(403);
  });

  it('is purely key-based below admin roles — the key alone decides', async () => {
    // Documents the contract deliberately: this middleware does not re-check the
    // role beyond the two admin bypasses, so the permission resolver is the
    // single place that decides who holds a key.
    const result = await runMiddleware(
      authorizePermissions('manageFees'),
      asUser('SUB_ADMIN', ['manageFees'])
    );
    expect(result.passed).toBe(true);
  });
});

describe('allowTeacherOrPermission(...keys)', () => {
  it('lets any TEACHER through regardless of permissions', async () => {
    const result = await runMiddleware(
      allowTeacherOrPermission('manageHR'),
      asUser('TEACHER', [])
    );
    expect(result.passed).toBe(true);
  });

  it('lets a SUB_ADMIN with the key through, and blocks one without', async () => {
    const allowed = await runMiddleware(
      allowTeacherOrPermission('manageHR'),
      asUser('SUB_ADMIN', ['manageHR'])
    );
    expect(allowed.passed).toBe(true);

    const denied = await runMiddleware(
      allowTeacherOrPermission('manageHR'),
      asUser('SUB_ADMIN', ['manageFees'])
    );
    expect(denied.error?.statusCode).toBe(403);
  });

  it('blocks a PARENT', async () => {
    const result = await runMiddleware(allowTeacherOrPermission('manageHR'), asUser('PARENT'));
    expect(result.error?.statusCode).toBe(403);
  });
});

describe('requireSuperAdmin', () => {
  it('allows only SUPER_ADMIN', async () => {
    expect((await runMiddleware(requireSuperAdmin, asUser('SUPER_ADMIN'))).passed).toBe(true);

    for (const role of ['SCHOOL_ADMIN', 'SUB_ADMIN', 'TEACHER', 'PARENT', 'DRIVER']) {
      const result = await runMiddleware(requireSuperAdmin, asUser(role));
      expect(result.passed, `${role} must not pass`).toBe(false);
      expect(result.error?.statusCode).toBe(403);
    }
  });
});
