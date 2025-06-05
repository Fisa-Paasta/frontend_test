// InitPage.tsx
import React from 'react';
import { useState, useEffect } from 'react';
import { Lock, User, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // useAuth를 가져옵니다.

const slogans: React.ReactElement[] = [
  <>빠르게 시작하는 <strong className="text-white">PaaS 환경</strong></>,
  <>사내 <strong className="text-white">인프라 자동화</strong>를 한눈에</>,
  <>DevSecOps <strong className="text-white">Ready</strong>. Enterprise <strong className="text-white">Secure</strong>.</>,
  <>구축부터 운영까지 <strong className="text-white">원스톱 제공</strong></>,
  <><span className="mr-1">☁️</span> <strong>클라우드 기반</strong> 인프라 신청</>,
  <><span className="mr-1">🧩</span> <strong>자동화된</strong> 배포 구성</>,
  <><span className="mr-1">🔒</span> <strong>금융권 보안 기준</strong> 준수</>,
  <><span className="mr-1">📊</span> <strong>실시간 모니터링</strong> & 로깅 제공</>
];

type FormField = 'id' | 'password' | 'department';

export default function InitPage() {
  // useNavigate는 AuthContext에서 사용하므로 여기서는 필요 없습니다.
  // const navigate = useNavigate(); 
  const { login } = useAuth(); // useAuth에서 login 함수를 가져옵니다.

  const [form, setForm] = useState<Record<FormField, string>>({
    id: '',
    password: '',
    department: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<FormField, string>> = {};
  
    // 사번 유효성 검사
    if (!form.id.trim()) newErrors.id = '사번을 입력해주세요.';
    else if (!/^\d{8}$/.test(form.id)) newErrors.id = '사번은 8자리 숫자여야 합니다.';
  
    // 비밀번호 유효성 검사
    if (!form.password.trim()) newErrors.password = '비밀번호를 입력해주세요.';
    else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{7,}$/.test(form.password)) {
      newErrors.password = '비밀번호는 영문 + 숫자 + 특수문자를 포함해 7자 이상이어야 합니다.';
    }
  
    // 부서 유효성 검사
    if (!form.department.trim()) newErrors.department = '부서를 선택해주세요.';
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as FormField]: value }));
    setErrors((prev) => ({ ...prev, [name as FormField]: '' }));
  };

  // AuthContext에서 로그인 로직을 처리하므로,
  // InitPage에서는 validateForm 후에 login 함수를 호출하기만 합니다.
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    // AuthContext의 login 함수를 호출
    const success = await login(form.id, form.password, form.department);

    // 로그인 실패 시 비밀번호 필드 초기화 (AuthContext에서 알림창을 띄우므로 여기서는 알림창X)
    if (!success) {
      setForm(prev => ({ ...prev, password: '' }));
    }
    // 성공 시 navigate는 AuthContext에서 이미 처리됩니다.
  };

  return (
    <div className="flex h-screen transition-colors duration-500 bg-background-light dark:bg-background-dark text-foreground-light dark:text-foreground-dark">
      {/* 왼쪽 슬로건 */}
      <div className="w-[40%] bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col justify-center items-center px-12 space-y-10">
        <img src="src/assets/logo.png" alt="Paasta 로고" className="w-28 h-28 drop-shadow-lg" />
        <h1 className="text-5xl font-bold text-white">Paasta</h1>
        <p className="text-lg font-medium text-white/90 text-center transition-all duration-500 ease-in-out">
          {slogans[currentSloganIndex]}
        </p>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="w-[60%] bg-background-light dark:bg-background-dark flex justify-center items-center px-8">
        <div className="bg-panel-light dark:bg-panel-dark text-foreground-light dark:text-foreground-dark rounded-2xl shadow-xl p-10 w-full max-w-2xl transition-colors duration-500">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-purple-500 dark:text-purple-400">
              <Sparkles className="w-6 h-6" /> Paasta에 오신 걸 환영합니다!
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
              <strong className="text-foreground-light dark:text-white">Paasta</strong>는 사내 <strong className="text-foreground-light dark:text-white">PaaS 환경</strong>을 손쉽게 조리하듯 구축하고, 누구나 쉽게 운영할 수 있도록 돕는 플랫폼입니다.
              <br />아래 정보를 입력하여 서비스를 시작해보세요.
            </p>
          </div>

          <div className="space-y-4">
            {/* 사번 */}
            <div>
              <div className="flex items-center bg-input-light dark:bg-input-dark rounded-md px-4 py-3 border border-border-light dark:border-border-dark">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  name="id"
                  type="text"
                  placeholder="사번"
                  value={form.id}
                  onChange={handleChange}
                  className="bg-transparent outline-none text-base w-full placeholder-gray-400 text-foreground-light dark:text-white"
                />
              </div>
              {errors.id && <p className="text-red-400 text-sm mt-1">{errors.id}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <div className="flex items-center bg-input-light dark:bg-input-dark rounded-md px-4 py-3 border border-border-light dark:border-border-dark">
                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호"
                  value={form.password}
                  onChange={handleChange}
                  className="bg-transparent outline-none text-base w-full placeholder-gray-400 text-foreground-light dark:text-white"
                />
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* 부서 */}
            <div>
              <div className="flex items-center bg-input-light dark:bg-input-dark rounded-md px-4 py-3 border border-border-light dark:border-border-dark">
                <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="bg-transparent outline-none text-base w-full placeholder-gray-400 text-foreground-light dark:text-white"
                  aria-label="부서를 선택하세요"
                >
                  <option value="" disabled>부서를 선택하세요</option>

                  <optgroup label="📇 카드사">
                    <option value="카드-디지털개발팀">디지털개발팀</option>
                    <option value="카드-데이터분석팀">데이터분석팀</option>
                    <option value="카드-서비스기획팀">서비스기획팀</option>
                  </optgroup>

                  <optgroup label="🏦 은행">
                    <option value="은행-IT인프라팀">IT인프라팀</option>
                    <option value="은행-핀테크기획팀">핀테크기획팀</option>
                    <option value="은행-정보보안팀">정보보안팀</option>
                  </optgroup>

                  <optgroup label="🛡 보험사">
                    <option value="보험-계리시스템팀">계리시스템팀</option>
                    <option value="보험-고객데이터팀">고객데이터팀</option>
                    <option value="보험-플랫폼개발팀">플랫폼개발팀</option>
                  </optgroup>

                  <optgroup label="📈 증권사">
                    <option value="증권-트레이딩플랫폼팀">트레이딩플랫폼팀</option>
                    <option value="증권-시장데이터팀">시장데이터팀</option>
                    <option value="증권-리스크관리팀">리스크관리팀</option>
                  </optgroup>
                </select>
              </div>
              {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department}</p>}
            </div>

            <button
              onClick={handleLogin}
              className="bg-purple-600 hover:brightness-110 focus:ring-2 focus:ring-purple-400 transition-all duration-200 ease-in-out w-full py-3 rounded-md text-white font-semibold text-lg"
            >
              로그인
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-8">
            © 2025 PAASTA Cloud Platform
          </p>
        </div>
      </div>
    </div>
  );
}