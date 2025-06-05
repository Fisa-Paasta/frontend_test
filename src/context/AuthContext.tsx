// AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate를 임포트

type Role = 'admin' | 'user';

interface AuthUser {
  userId: string;
  userName: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  // login 메소드 시그니처 변경: InitPage에서 필요한 인자를 받도록 함
  login: (employeeId: string, password: string, department: string) => Promise<boolean>; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 전역 타이머
let logoutTimer: ReturnType<typeof setTimeout>;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // AuthProvider에서 useNavigate 훅 사용

  const logout = useCallback(() => {
    console.log('⏱️ 자동 로그아웃 또는 수동 로그아웃');
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    if (logoutTimer) clearTimeout(logoutTimer);
    navigate('/init'); // window.location.href 대신 navigate 사용
  }, [navigate]);

  // login 메소드를 InitPage의 로그인 로직을 포함하도록 확장
  const login = useCallback(async (employeeId: string, password: string, department: string): Promise<boolean> => {
    setIsLoading(true); // 로그인 시도 시 로딩 상태 시작
    try {
      // InitPage의 validateDepartmentAccess 로직을 여기로 가져옴
      const validateDepartmentAccess = (id: string, dept: string): { isValid: boolean; role: 'admin' | 'user' | null } => {
        const isITInfraDept = dept === '은행-IT인프라팀';
        
        // 임시 관리자 계정 (12345678)
        if (id === '12345678') {
          if (isITInfraDept) {
            return { isValid: true, role: 'admin' };
          } else {
            return { isValid: false, role: null };
          }
        }
        
        // 임시 사용자 계정 (99991234)
        if (id === '99991234') {
          if (isITInfraDept) {
            return { isValid: false, role: null };
          } else {
            return { isValid: true, role: 'user' };
          }
        }
        return { isValid: true, role: null }; // 그 외 계정은 기본적으로 유효
      };

      const accessCheck = validateDepartmentAccess(employeeId, department);
      
      if (!accessCheck.isValid) {
        alert('❌ 권한이 없습니다.');
        return false;
      }

      const isTempUserLogin =
        employeeId === '99991234' &&
        password === 'user123!' &&
        accessCheck.role === 'user';
      
      const isTempAdminLogin =
        employeeId === '12345678' &&
        password === 'VMware1!' &&
        accessCheck.role === 'admin';
      
      // ✅ 1. 임시 사용자 로그인 처리
      if (isTempUserLogin) {
        localStorage.setItem('token', 'test-user-token');
        localStorage.setItem('userName', '임시 사용자');
        localStorage.setItem('userId', employeeId);
        localStorage.setItem('role', 'user');
        
        // `AuthContext`의 `setUser`를 직접 호출하여 상태 업데이트
        // 이 `setUser`는 `handleSetUser`로 인해 `startInactivityTimer`도 호출
        setUser({
          userId: employeeId,
          userName: '임시 사용자',
          role: 'user',
        });
        
        navigate('/home'); // 로그인 성공 시 홈으로 이동
        return true;
      }
      
      // ✅ 2. 임시 관리자 로그인 처리
      if (isTempAdminLogin) {
        localStorage.setItem('token', 'test-admin-token');
        localStorage.setItem('userName', '테스트 관리자');
        localStorage.setItem('userId', employeeId);
        localStorage.setItem('role', 'admin');

        setUser({
          userId: employeeId,
          userName: '테스트 관리자',
          role: 'admin',
        });

        navigate('/admin'); // 관리자는 관리자 페이지로 이동
        return true;
      }

      // ✅ 3. 실제 API 요청 처리
      const res = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: employeeId, password, department }), // API 요청에 필요한 데이터
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: '로그인 실패' }));
        throw new Error(errorData.message ?? '로그인 실패');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userId', employeeId);
      localStorage.setItem('role', data.role);

      setUser({
        userId: employeeId,
        userName: data.name,
        role: data.role,
      });

      navigate(data.role === 'admin' ? '/admin' : '/home'); // 역할에 따라 이동
      return true;

    } catch (error) {
      console.error('로그인 오류:', error);
      alert('❌ 로그인 실패: 사번, 비밀번호 또는 부서를 확인해주세요.'); // 사용자에게 메시지
      return false; // 로그인 실패
    } finally {
      setIsLoading(false); // 로그인 시도 종료 시 로딩 상태 해제
    }
  }, [navigate]); // navigate를 의존성 배열에 추가

  const startInactivityTimer = useCallback(() => {
    if (logoutTimer) clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
      alert('15분 동안 활동이 없어 자동 로그아웃되었습니다.');
      logout();
    }, 15 * 60 * 1000); // 15분
  }, [logout]);

  const handleSetUser = useCallback((newUser: AuthUser | null) => {
    setUser(newUser);
    setIsAuthenticated(!!newUser);
    if (newUser) startInactivityTimer();
  }, [startInactivityTimer]);

  const resetInactivityTimer = useCallback(() => {
    if (user) startInactivityTimer();
  }, [user, startInactivityTimer]);

  const verifyTokenWithServer = useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:8080/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return res.ok;
    } catch {
      console.warn('⚠️ 서버 연결 실패, 임시로 로컬 상태 유지');
      return true;
    }
  }, []);

  const restoreAuthState = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('role') as Role | null;
  
    if (!storedToken || !storedUserId || !storedUserName || !storedRole) {
      setIsLoading(false); // 복원할 상태가 없으면 로딩 종료
      return;
    }
  
    console.log('🔄 로그인 상태 복원 중...');
    
    // 임시 토큰은 검증 없이 바로 복원
    if (storedToken === 'test-user-token' || 
        storedToken === 'test-admin-token' || 
        storedToken.startsWith('mock-jwt-token-')) {
      
      // act 래핑은 테스트 환경에서만 필요하며, 실제 앱 코드에는 포함하지 않습니다.
      // 여기서는 예시를 위해 제거합니다.
      setUser({
        userId: storedUserId,
        userName: storedUserName,
        role: storedRole,
      });
      setIsAuthenticated(true);
      setIsLoading(false);
      console.log('✅ 임시 토큰으로 로그인 상태 복원 완료');
      return;
    }
  
    // 실제 토큰은 서버 검증
    const isValid = await verifyTokenWithServer(storedToken);
    if (isValid) {
      // act 래핑은 테스트 환경에서만 필요하며, 실제 앱 코드에는 포함하지 않습니다.
      setUser({
        userId: storedUserId,
        userName: storedUserName,
        role: storedRole,
      });
      setIsAuthenticated(true);
    } else {
      console.warn('⚠️ 토큰 검증 실패, 로그아웃 처리');
      localStorage.clear();
      setIsAuthenticated(false);
    }
    setIsLoading(false); // 실제 토큰 처리 후 로딩 종료
  }, [verifyTokenWithServer]);

  // 초기 인증 상태 복구 (새로고침 대응)
  useEffect(() => {
    const initializeAuth = async () => {
      await restoreAuthState();
    };
    void initializeAuth();
  }, [restoreAuthState]);

  // 비활동 이벤트 감지
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [resetInactivityTimer]);

  const contextValue = useMemo(() => ({
    user,
    setUser: handleSetUser,
    logout,
    isLoading,
    isAuthenticated,
    login,
  }), [user, handleSetUser, logout, isLoading, isAuthenticated, login]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export type { AuthContextType, AuthUser };