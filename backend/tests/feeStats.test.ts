import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryRaw = vi.fn();

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    feePayment: { findMany: vi.fn(), count: vi.fn() },
    parent: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
  },
}));

vi.mock('../src/utils/pushNotification.js', () => ({ sendPushToUsers: vi.fn() }));
vi.mock('../src/utils/auditLog.js', () => ({ recordAudit: vi.fn() }));

const { getFeeStats } = await import('../src/controllers/fee.controller.js');
const { fakeRequest, fakeResponse } = await import('./helpers.js');

const OWN = 'school-own';
const OTHER = 'school-other';

async function call(
  user: Record<string, unknown> | undefined,
  query: Record<string, string> = {}
) {
  const req = fakeRequest({ user: user as never, query });
  const res = fakeResponse();
  const next = vi.fn();
  await (getFeeStats as never as (r: unknown, s: unknown, n: unknown) => Promise<void>)(req, res, next);
  return {
    payload: res.payload as Record<string, number> | undefined,
    error: next.mock.calls[0]?.[0] as { message: string; statusCode?: number } | undefined,
    // The schoolId is the only interpolated value in the tagged template.
    boundSchoolId: queryRaw.mock.calls[0]?.[1],
  };
}

const asUser = (role: string) => ({ id: 'u1', email: 'a@b.c', role, schoolId: OWN });

describe('getFeeStats', () => {
  beforeEach(() => {
    queryRaw.mockReset().mockResolvedValue([
      { totalBilled: 21499, collected: 3000, pending: 6500, paymentCount: 6 },
    ]);
  });

  it('returns the aggregate and derives the collection rate', async () => {
    const { payload } = await call(asUser('SCHOOL_ADMIN'));
    expect(payload).toEqual({
      totalBilled: 21499,
      collected: 3000,
      pending: 6500,
      paymentCount: 6,
      collectionRate: (3000 / 21499) * 100,
    });
  });

  it('reports a zero collection rate rather than dividing by zero', async () => {
    queryRaw.mockResolvedValue([
      { totalBilled: 0, collected: 0, pending: 0, paymentCount: 0 },
    ]);
    const { payload } = await call(asUser('SCHOOL_ADMIN'));
    expect(payload?.collectionRate).toBe(0);
    expect(Number.isNaN(payload?.collectionRate)).toBe(false);
  });

  it('binds the caller\'s own school, ignoring a schoolId they try to pass', async () => {
    const { boundSchoolId } = await call(asUser('SCHOOL_ADMIN'), { schoolId: OTHER });
    expect(boundSchoolId).toBe(OWN);
  });

  it.each(['SUB_ADMIN', 'TEACHER'])('binds %s to their own school too', async (role) => {
    const { boundSchoolId } = await call(asUser(role), { schoolId: OTHER });
    expect(boundSchoolId).toBe(OWN);
  });

  it('lets a SUPER_ADMIN target a specific school', async () => {
    const { boundSchoolId } = await call(asUser('SUPER_ADMIN'), { schoolId: OTHER });
    expect(boundSchoolId).toBe(OTHER);
  });

  it('falls back to a SUPER_ADMIN\'s own school when none is named', async () => {
    const { boundSchoolId } = await call(asUser('SUPER_ADMIN'));
    expect(boundSchoolId).toBe(OWN);
  });

  it('rejects a user with no school context instead of aggregating everything', async () => {
    const { error } = await call({ id: 'u1', email: 'a@b.c', role: 'SCHOOL_ADMIN', schoolId: '' });
    expect(error?.statusCode).toBe(400);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('survives an empty result set', async () => {
    queryRaw.mockResolvedValue([]);
    const { payload, error } = await call(asUser('SCHOOL_ADMIN'));
    expect(error).toBeUndefined();
    expect(payload).toMatchObject({ totalBilled: 0, collected: 0, pending: 0, collectionRate: 0 });
  });
});
