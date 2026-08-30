import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = {
  holiday: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  announcement: { findFirst: vi.fn() },
  feePayment: { findFirst: vi.fn(), update: vi.fn() },
  homeworkSubmission: { findFirst: vi.fn(), update: vi.fn() },
  teacher: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
};

vi.mock('../src/lib/prisma.js', () => ({ prisma: db }));
vi.mock('../src/utils/pushNotification.js', () => ({
  sendPushToUsers: vi.fn(),
  sendPushToUser: vi.fn(),
  sendPushToSchool: vi.fn(),
}));
vi.mock('../src/utils/auditLog.js', () => ({ recordAudit: vi.fn() }));

const holidays = await import('../src/controllers/holiday.controller.js');
const announcements = await import('../src/controllers/announcement.controller.js');
const fees = await import('../src/controllers/fee.controller.js');
const homework = await import('../src/controllers/homework.controller.js');
const teachers = await import('../src/controllers/teacher.controller.js');
const { fakeRequest, fakeResponse } = await import('./helpers.js');

const OWN = 'school-own';

const asUser = (role: string) => ({ id: 'u1', email: 'a@b.c', role, schoolId: OWN });

async function call(
  handler: unknown,
  req: ReturnType<typeof fakeRequest>
) {
  const res = fakeResponse();
  const next = vi.fn();
  await (handler as (r: unknown, s: unknown, n: unknown) => Promise<void>)(req, res, next);
  return { error: next.mock.calls[0]?.[0] as { statusCode?: number } | undefined, res };
}

/** The tenant predicate the lookup was actually issued with. */
const whereOf = (fn: { mock: { calls: unknown[][] } }) =>
  (fn.mock.calls[0]?.[0] as { where: Record<string, unknown> })?.where;

describe('records are looked up scoped to the caller\'s school', () => {
  beforeEach(() => {
    for (const model of Object.values(db)) {
      for (const method of Object.values(model)) (method as { mockReset: () => void }).mockReset();
    }
    // Default: nothing matches within the caller's tenant.
    db.holiday.findFirst.mockResolvedValue(null);
    db.announcement.findFirst.mockResolvedValue(null);
    db.feePayment.findFirst.mockResolvedValue(null);
    db.homeworkSubmission.findFirst.mockResolvedValue(null);
    db.teacher.findFirst.mockResolvedValue(null);
  });

  it('updateHoliday scopes by schoolId and 404s on another school\'s id', async () => {
    const { error } = await call(
      holidays.updateHoliday,
      fakeRequest({ user: asUser('SCHOOL_ADMIN'), params: { id: 'h-other' }, body: { name: 'x' } })
    );
    expect(whereOf(db.holiday.findFirst)).toMatchObject({ id: 'h-other', schoolId: OWN });
    expect(error?.statusCode).toBe(404);
    expect(db.holiday.update).not.toHaveBeenCalled();
  });

  it('deleteHoliday scopes by schoolId and never deletes across tenants', async () => {
    const { error } = await call(
      holidays.deleteHoliday,
      fakeRequest({ user: asUser('SCHOOL_ADMIN'), params: { id: 'h-other' } })
    );
    expect(whereOf(db.holiday.findFirst)).toMatchObject({ id: 'h-other', schoolId: OWN });
    expect(error?.statusCode).toBe(404);
    expect(db.holiday.delete).not.toHaveBeenCalled();
  });

  it('getAnnouncement scopes by schoolId', async () => {
    const { error } = await call(
      announcements.getAnnouncement,
      fakeRequest({ user: asUser('TEACHER'), params: { id: 'a-other' } })
    );
    expect(whereOf(db.announcement.findFirst)).toMatchObject({ id: 'a-other', schoolId: OWN });
    expect(error?.statusCode).toBe(404);
  });

  it('updatePayment scopes through the student\'s school', async () => {
    const { error } = await call(
      fees.updatePayment,
      fakeRequest({ user: asUser('SCHOOL_ADMIN'), params: { id: 'p-other' }, body: { status: 'PAID' } })
    );
    expect(whereOf(db.feePayment.findFirst)).toMatchObject({
      id: 'p-other',
      student: { schoolId: OWN },
    });
    expect(error?.statusCode).toBe(404);
    expect(db.feePayment.update).not.toHaveBeenCalled();
  });

  it('evaluateHomework scopes through the homework\'s school', async () => {
    const { error } = await call(
      homework.evaluateHomework,
      fakeRequest({ user: asUser('TEACHER'), params: { id: 's-other' }, body: { marks: 10 } })
    );
    expect(whereOf(db.homeworkSubmission.findFirst)).toMatchObject({
      id: 's-other',
      homework: { schoolId: OWN },
    });
    expect(error?.statusCode).toBe(404);
    expect(db.homeworkSubmission.update).not.toHaveBeenCalled();
  });

  it('getTeacher scopes by schoolId — staff records are not readable across schools', async () => {
    const { error } = await call(
      teachers.getTeacher,
      fakeRequest({ user: asUser('SCHOOL_ADMIN'), params: { id: 't-other' } })
    );
    expect(whereOf(db.teacher.findFirst)).toMatchObject({ id: 't-other', schoolId: OWN });
    expect(error?.statusCode).toBe(404);
  });

  it('updateTeacher scopes by schoolId', async () => {
    const { error } = await call(
      teachers.updateTeacher,
      fakeRequest({ user: asUser('SUB_ADMIN'), params: { id: 't-other' }, body: { phone: '1' } })
    );
    expect(whereOf(db.teacher.findFirst)).toMatchObject({ id: 't-other', schoolId: OWN });
    expect(error?.statusCode).toBe(404);
    expect(db.teacher.update).not.toHaveBeenCalled();
  });

  it('deleteTeacher scopes by schoolId — an HR admin cannot delete another school\'s staff', async () => {
    const { error } = await call(
      teachers.deleteTeacher,
      fakeRequest({ user: asUser('SUB_ADMIN'), params: { id: 't-other' } })
    );
    expect(whereOf(db.teacher.findFirst)).toMatchObject({ id: 't-other', schoolId: OWN });
    expect(error?.statusCode).toBe(404);
    expect(db.teacher.delete).not.toHaveBeenCalled();
  });

  it('lets a SUPER_ADMIN reach across tenants deliberately', async () => {
    await call(
      holidays.updateHoliday,
      fakeRequest({ user: asUser('SUPER_ADMIN'), params: { id: 'h-other' }, body: { name: 'x' } })
    );
    const where = whereOf(db.holiday.findFirst);
    expect(where.id).toBe('h-other');
    expect(where.schoolId).toBeUndefined();
  });
});
