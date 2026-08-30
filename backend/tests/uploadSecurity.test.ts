import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

const existsSync = vi.fn(() => true);
const unlinkSync = vi.fn();
const mkdirSync = vi.fn();

vi.mock('fs', () => ({
  default: {
    existsSync: (...a: unknown[]) => existsSync(...(a as [])),
    unlinkSync: (...a: unknown[]) => unlinkSync(...(a as [])),
    mkdirSync: (...a: unknown[]) => mkdirSync(...(a as [])),
  },
  existsSync: (...a: unknown[]) => existsSync(...(a as [])),
  unlinkSync: (...a: unknown[]) => unlinkSync(...(a as [])),
  mkdirSync: (...a: unknown[]) => mkdirSync(...(a as [])),
}));

const { deleteFile } = await import('../src/controllers/upload.controller.js');
const { fakeRequest, fakeResponse } = await import('./helpers.js');

const SCHOOL = 'school-1';

async function callDelete(filename: string) {
  const req = fakeRequest({
    params: { filename },
    user: { id: 'u1', email: 'a@b.c', role: 'SCHOOL_ADMIN', schoolId: SCHOOL },
  });
  const res = fakeResponse();
  const next = vi.fn();
  await (deleteFile as never as (r: unknown, s: unknown, n: unknown) => Promise<void>)(req, res, next);
  return {
    error: next.mock.calls[0]?.[0] as { message: string; statusCode?: number } | undefined,
    deletedPath: unlinkSync.mock.calls[0]?.[0] as string | undefined,
  };
}

describe('deleteFile path safety', () => {
  beforeEach(() => {
    existsSync.mockReset().mockReturnValue(true);
    unlinkSync.mockReset();
  });

  it('deletes an ordinary file inside the school folder', async () => {
    const { error, deletedPath } = await callDelete('report-1234.pdf');
    expect(error).toBeUndefined();
    expect(deletedPath).toBeDefined();
    expect(path.basename(deletedPath!)).toBe('report-1234.pdf');
    // and it lands under the caller's own school directory
    expect(deletedPath!.split(path.sep)).toContain(SCHOOL);
  });

  it.each([
    ['../../.env', 'parent traversal'],
    ['../../../etc/passwd', 'deep traversal'],
    ['..\\..\\windows\\system32\\config', 'windows-style traversal'],
    ['../school-2/private.pdf', 'sideways into another tenant'],
  ])('never escapes the school folder for %s (%s)', async (filename) => {
    // req.params is URL-decoded, so an encoded '..%2F..%2F' arrives here as
    // real path separators — the guard must strip them.
    const { deletedPath } = await callDelete(filename);

    if (deletedPath) {
      const segments = deletedPath.split(path.sep);
      expect(segments).not.toContain('..');
      expect(segments).toContain(SCHOOL);
      // The school folder must be the immediate parent of whatever is removed.
      expect(segments[segments.length - 2]).toBe(SCHOOL);
    }
  });

  it('returns 404 rather than deleting when the file is absent', async () => {
    existsSync.mockReturnValue(false);
    const { error } = await callDelete('missing.pdf');
    expect(error?.statusCode).toBe(404);
    expect(unlinkSync).not.toHaveBeenCalled();
  });
});
