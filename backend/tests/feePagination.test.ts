import { describe, it, expect, vi, beforeEach } from 'vitest';

const findManyPayment = vi.fn();
const countPayment = vi.fn();

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    feePayment: {
      findMany: (...args: unknown[]) => findManyPayment(...args),
      count: (...args: unknown[]) => countPayment(...args),
    },
    parent: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
  },
}));

vi.mock('../src/utils/pushNotification.js', () => ({ sendPushToUsers: vi.fn() }));
vi.mock('../src/utils/auditLog.js', () => ({ recordAudit: vi.fn() }));

const { getPayments } = await import('../src/controllers/fee.controller.js');
const { fakeRequest, fakeResponse } = await import('./helpers.js');

const admin = { id: 'u1', email: 'a@b.c', role: 'SCHOOL_ADMIN', schoolId: 'school-1' };

async function call(query: Record<string, string>) {
  const req = fakeRequest({ user: admin, query });
  const res = fakeResponse();
  const next = vi.fn();
  await (getPayments as never as (r: unknown, s: unknown, n: unknown) => Promise<void>)(req, res, next);
  return { payload: res.payload, error: next.mock.calls[0]?.[0], findArgs: findManyPayment.mock.calls[0]?.[0] };
}

describe('getPayments pagination', () => {
  beforeEach(() => {
    findManyPayment.mockReset().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    countPayment.mockReset().mockResolvedValue(97);
  });

  it('returns a plain array when no page or limit is given', async () => {
    // Backwards compatibility: the dashboard totals and the parent views still
    // consume an array, so the default shape must not change.
    const { payload, findArgs } = await call({});
    expect(Array.isArray(payload)).toBe(true);
    expect(findArgs.skip).toBeUndefined();
    expect(countPayment).not.toHaveBeenCalled();
  });

  it('returns an envelope with pagination when limit is given', async () => {
    const { payload, findArgs } = await call({ limit: '5' });

    expect(Array.isArray(payload)).toBe(false);
    const body = payload as { payments: unknown[]; pagination: Record<string, number> };
    expect(body.payments).toHaveLength(2);
    expect(body.pagination).toEqual({ page: 1, limit: 5, total: 97, pages: 20 });
    expect(findArgs.take).toBe(5);
    expect(findArgs.skip).toBe(0);
  });

  it('computes skip from the requested page', async () => {
    const { findArgs } = await call({ page: '3', limit: '10' });
    expect(findArgs.skip).toBe(20);
    expect(findArgs.take).toBe(10);
  });

  it('caps an oversized limit rather than letting a caller pull everything', async () => {
    const { findArgs } = await call({ limit: '999999' });
    expect(findArgs.take).toBe(5000);
  });

  it('clamps nonsensical page and limit values to something safe', async () => {
    const negative = await call({ page: '-4', limit: '-10' });
    expect(negative.findArgs.skip).toBe(0);
    expect(negative.findArgs.take).toBeGreaterThan(0);

    findManyPayment.mockClear();
    const garbage = await call({ page: 'abc', limit: 'xyz' });
    expect(garbage.findArgs.skip).toBe(0);
    expect(garbage.findArgs.take).toBe(25);
  });

  it('always scopes an admin query to their own school', async () => {
    const { findArgs } = await call({ limit: '5' });
    expect(findArgs.where.student).toEqual({ schoolId: 'school-1' });
  });
});
