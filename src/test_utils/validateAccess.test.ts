// src/test_utils/validateAccess.test.ts

import { validateDepartmentAccess } from './validateAccess';

describe('validateDepartmentAccess', () => {
  it('returns valid for known user and matching department', () => {
    const result = validateDepartmentAccess('emp001', '은행-IT인프라팀');
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for known user with wrong department', () => {
    const result = validateDepartmentAccess('emp001', '카드-데이터팀');
    expect(result.isValid).toBe(false);
  });

  it('returns invalid for unknown user', () => {
    const result = validateDepartmentAccess('unknown', '은행-IT인프라팀');
    expect(result.isValid).toBe(false);
  });
});
