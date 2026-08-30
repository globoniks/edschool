import { describe, it, expect } from 'vitest';
import { getUserPermissions, PERMISSION_KEYS } from '../src/utils/permissions.js';
import type { UserWithTags } from '../src/utils/permissions.js';

const tagged = (role: UserWithTags['role'], ...permissionSets: string[][]): UserWithTags => ({
  role,
  userTags: permissionSets.map((permissions, i) => ({
    tag: { slug: `tag-${i}`, permissions },
  })),
});

describe('getUserPermissions', () => {
  it('gives SUPER_ADMIN and SCHOOL_ADMIN every permission', () => {
    for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN'] as const) {
      const perms = getUserPermissions({ role });
      expect(perms.sort()).toEqual([...PERMISSION_KEYS].sort());
    }
  });

  it('gives an untagged SUB_ADMIN nothing at all', () => {
    expect(getUserPermissions({ role: 'SUB_ADMIN' })).toEqual([]);
    expect(getUserPermissions(tagged('SUB_ADMIN'))).toEqual([]);
  });

  it('merges permissions across a SUB_ADMIN\'s tags without duplicating', () => {
    const user = tagged('SUB_ADMIN', ['manageFees', 'viewReports'], ['viewReports', 'manageHR']);
    const perms = getUserPermissions(user);
    expect(perms.sort()).toEqual(['manageFees', 'manageHR', 'viewReports']);
  });

  it('gives every TEACHER enterMarks, plus anything their tags carry', () => {
    expect(getUserPermissions({ role: 'TEACHER' })).toEqual(['enterMarks']);

    const hod = tagged('TEACHER', ['hodViewSubmissions', 'hodEnterExamMarks']);
    expect(getUserPermissions(hod).sort()).toEqual([
      'enterMarks',
      'hodEnterExamMarks',
      'hodViewSubmissions',
    ]);
  });

  it('gives a DRIVER only bus tracking', () => {
    expect(getUserPermissions({ role: 'DRIVER' })).toEqual(['viewBusTracking']);
  });

  it('gives a PARENT no tag-derived permissions, even if tags are attached', () => {
    // Parents are scoped to their own children by dedicated middleware, never by
    // permission keys — a stray tag must not become an escalation path.
    const parent = tagged('PARENT', ['manageFees', 'manageHR']);
    expect(getUserPermissions(parent)).toEqual([]);
  });

  it('ignores a tag whose permissions are not an array', () => {
    const broken: UserWithTags = {
      role: 'SUB_ADMIN',
      userTags: [{ tag: { slug: 'broken', permissions: 'manageFees' } }],
    };
    expect(getUserPermissions(broken)).toEqual([]);
  });
});
