interface DepartmentAccessRule {
    department: string;
    allowedUserIds: string[];
  }
  
  // 예시: 부서별 접근 가능한 사용자 ID 목록
  const departmentAccessRules: DepartmentAccessRule[] = [
    {
      department: '은행-IT인프라팀',
      allowedUserIds: ['emp001', 'emp002'],
    },
    {
      department: '카드-데이터팀',
      allowedUserIds: ['emp010', 'emp011'],
    },
    // ... 추가 가능
  ];
  
  export function validateDepartmentAccess(userId: string, department: string): {
    isValid: boolean;
    reason?: string;
  } {
    const rule = departmentAccessRules.find((r) => r.department === department);
  
    if (!rule) {
      return {
        isValid: false,
        reason: '등록되지 않은 부서입니다.',
      };
    }
  
    const isAuthorized = rule.allowedUserIds.includes(userId);
  
    return {
      isValid: isAuthorized,
      reason: isAuthorized ? undefined : '접근 권한이 없습니다.',
    };
  }
  