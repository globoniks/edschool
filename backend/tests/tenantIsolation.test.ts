import { describe, it, expect, vi, beforeEach } from 'vitest';

const findManySchool = vi.fn();
const findUniqueSchool = vi.fn();
const updateSchool = vi.fn();

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    school: {
      findMany: (...args: unknown[]) => findManySchool(...args),
      findUnique: (...args: unknown[]) => findUniqueSchool(...args),
      update: (...args: unknown[]) => updateSchool(...args),
    },
  },
}));

const controller = await import('../src/controllers/school.controller.js');
const { fakeRequest, fakeResponse } = await import('./helpers.js');

const OWN_SCHOOL = 'school-own';
const OTHER_SCHOOL = 'school-someone-else';

const asUser = (role: string, extra: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'user@test.local',
  role,
  schoolId: OWN_SCHOOL,
  ...extra,
});

/** Invoke a controller and capture whichever of res/next it used. */
async function call(
  handler: (req: never, res: never, next: never) => unknown,
  req: ReturnType<typeof fakeRequest>
) {
  const res = fakeResponse();
  const next = vi.fn();
  await (handler as never as (r: unknown, s: unknown, n: unknown) => Promise<void>)(req, res, next);
  const error = next.mock.calls[0]?.[0] as { message: string; statusCode?: number } | undefined;
  return { res, error };
}

describe('school endpoints are tenant-scoped', () => {
  beforeEach(() => {
    findManySchool.mockReset().mockResolvedValue([]);
    findUniqueSchool.mockReset().mockResolvedValue({ id: OWN_SCHOOL, name: 'Own' });
    updateSchool.mockReset().mockResolvedValue({ id: OWN_SCHOOL, name: 'Own' });
  });

  describe('getSchools', () => {
    it('restricts a SCHOOL_ADMIN to their own school', async () => {
      await call(controller.getSchools, fakeRequest({ user: asUser('SCHOOL_ADMIN') }));

      const where = findManySchool.mock.calls[0][0].where;
      expect(where.id).toBe(OWN_SCHOOL);
    });

    it.each(['SUB_ADMIN', 'TEACHER', 'PARENT', 'DRIVER'])(
      'restricts a %s to their own school',
      async (role) => {
        await call(controller.getSchools, fakeRequest({ user: asUser(role) }));
        expect(findManySchool.mock.calls[0][0].where.id).toBe(OWN_SCHOOL);
      }
    );

    it('lets a SUPER_ADMIN see every school', async () => {
      await call(controller.getSchools, fakeRequest({ user: asUser('SUPER_ADMIN') }));

      const where = findManySchool.mock.calls[0][0].where;
      expect(where.id).toBeUndefined();
      expect(where.isActive).toBe(true);
    });
  });

  describe('getSchool', () => {
    it('refuses to read another school', async () => {
      const { error } = await call(
        controller.getSchool,
        fakeRequest({ user: asUser('SCHOOL_ADMIN'), params: { id: OTHER_SCHOOL } })
      );
      expect(error?.statusCode).toBe(403);
      expect(findUniqueSchool).not.toHaveBeenCalled();
    });

    it('allows reading own school', async () => {
      const { error } = await call(
        controller.getSchool,
        fakeRequest({ user: asUser('SCHOOL_ADMIN'), params: { id: OWN_SCHOOL } })
      );
      expect(error).toBeUndefined();
      expect(findUniqueSchool).toHaveBeenCalled();
    });

    it('allows a SUPER_ADMIN to read any school', async () => {
      const { error } = await call(
        controller.getSchool,
        fakeRequest({ user: asUser('SUPER_ADMIN'), params: { id: OTHER_SCHOOL } })
      );
      expect(error).toBeUndefined();
    });
  });

  describe('updateSchool', () => {
    it('refuses to write to another school', async () => {
      const { error } = await call(
        controller.updateSchool,
        fakeRequest({
          user: asUser('SCHOOL_ADMIN'),
          params: { id: OTHER_SCHOOL },
          body: { name: 'Hijacked' },
        })
      );
      expect(error?.statusCode).toBe(403);
      expect(updateSchool).not.toHaveBeenCalled();
    });

    it('allows updating own school', async () => {
      const { error } = await call(
        controller.updateSchool,
        fakeRequest({
          user: asUser('SCHOOL_ADMIN'),
          params: { id: OWN_SCHOOL },
          body: { name: 'Renamed' },
        })
      );
      expect(error).toBeUndefined();
      expect(updateSchool).toHaveBeenCalled();
    });

    it('allows a SUPER_ADMIN to update any school', async () => {
      const { error } = await call(
        controller.updateSchool,
        fakeRequest({
          user: asUser('SUPER_ADMIN'),
          params: { id: OTHER_SCHOOL },
          body: { name: 'Renamed by platform owner' },
        })
      );
      expect(error).toBeUndefined();
      expect(updateSchool).toHaveBeenCalled();
    });
  });
});
