import React from 'react';
import { useSurvey } from '@/context/SurveyContext';
import { FrontendItem } from '@/types/survey';
import {
  Trash2Icon
} from 'lucide-react';

// 컴포넌트 외부로 이동: frontendOptions
const frontendOptions: Record<string, string[]> = {
  react: ['19.1.0', '18.3.1', '17.0.2'],
  vue: ['3.5.13 (Latest)', '3.5.0'],
  angular: ['19.2.9 (Latest)', '19.2.0'],
  nextjs: ['15.3.0', '14.2.0'],
  vite: ['5.2.7', '5.0.0', '4.5.2'],
  typescript: ['5.4.5', '5.3.3', '4.9.5'],
};

// 컴포넌트 외부로 이동: frontendFrameworks
const frontendFrameworks: {
  name: string;
  label: string;
  src: string;
}[] = [
  { name: 'react', label: 'React', src: '/img/frontend/react.png' },
  { name: 'vue', label: 'Vue.js', src: '/img/frontend/vue.png' },
  { name: 'angular', label: 'Angular', src: '/img/frontend/angular.png' },
  { name: 'nextjs', label: 'Next.js', src: '/img/frontend/nextjs.png' },
  { name: 'vite', label: 'Vite', src: '/img/frontend/vite.png' },
  { name: 'typescript', label: 'TypeScript', src: '/img/frontend/typescript.png' },
];

export default function Step5_Frontend() {
  const { formData, updateFormData } = useSurvey();
  
  const items = formData.frontendItems || []; 
  
  const initialDomain = formData.frontendDomain || '';
  // ✅ domainError의 초기값을 initialDomain에 따라 계산합니다.
  const initialDomainError = initialDomain !== '' && !/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(initialDomain);

  const [frontendDomain, setFrontendDomain] = React.useState<string>(initialDomain);
  const [domainError, setDomainError] = React.useState(initialDomainError); // ✅ 수정

  // useEffect는 frontendDomain 변경만 추적하여 updateFormData를 호출합니다.
  React.useEffect(() => {
    updateFormData('frontendDomain', frontendDomain);
  }, [frontendDomain, updateFormData]);

  const handleDomainChange = (value: string) => {
    setFrontendDomain(value);
    setDomainError(value !== '' && !/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(value));
  };

  // handleFrameworkClick, handleAdd, handleRemove 함수들을 `updateFormData`를 사용하도록 수정
  const handleFrameworkClick = (index: number, frameworkName: string) => {
    const updatedItems = [...items];
    const currentFramework = updatedItems[index].framework;
    
    if (currentFramework === frameworkName) {
      updatedItems[index].framework = '';
      updatedItems[index].version = '';
    } else {
      updatedItems[index].framework = frameworkName;
      updatedItems[index].version = '';
    }
    
    // setItems 대신 updateFormData를 호출하여 부모 Context의 상태를 업데이트합니다.
    updateFormData('frontendItems', updatedItems); 
  };

  const handleChange = (index: number, field: 'framework' | 'version', value: string) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    if (field === 'framework') updatedItems[index].version = '';
    updateFormData('frontendItems', updatedItems);
  };

  const handleAdd = () => {
    updateFormData('frontendItems', [...items, { id: Date.now(), framework: '', version: '' }]);
  };

  const handleRemove = (targetId: number) => {
    updateFormData('frontendItems', items.filter(item => item.id !== targetId));
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
          <fieldset className="flex-1">
            <legend className="text-sm font-medium mb-3 flex items-center justify-between">
              <span>
                프론트엔드 프레임워크 선택 {i + 1}
                <span className="text-xs text-gray-500 ml-2">(선택된 항목을 다시 클릭하면 해제됩니다)</span>
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-red-600 text-lg hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                  aria-label={`프론트엔드 항목 ${i + 1} 삭제`}
                >
                  <Trash2Icon className="text-red-600 dark:text-red-400" size={18} />
                </button>
              )}
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {frontendFrameworks.map((fw) => (
                <button
                  key={fw.name}
                  type="button"
                  onClick={() => handleFrameworkClick(i, fw.name)}
                  className={`p-3 rounded-lg border-2 cursor-pointer text-center transition shadow-sm block w-full
                    ${item.framework === fw.name
                      ? 'border-violet-500 bg-violet-600 text-white'
                      : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'}
                  `}
                  aria-pressed={item.framework === fw.name}
                  aria-label={`${fw.label} ${item.framework === fw.name ? '선택됨 (클릭하여 해제)' : '선택하기'}`}
                >
                  <img
                    src={fw.src}
                    alt={`${fw.label} 로고`}
                    className="w-full h-16 object-contain mb-2"
                  />
                  <span className="text-sm font-semibold">{fw.label}</span>
                </button>
              ))}
            </div>

            {item.framework && (
              <div className="mt-4">
                <label htmlFor={`version-select-${item.id}`} className="block mb-1 text-sm font-medium">
                  {item.framework} 버전 선택
                </label>
                <select
                  id={`version-select-${item.id}`}
                  value={item.version}
                  onChange={(e) => handleChange(i, 'version', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  aria-label={`${item.framework} 버전 선택`}
                >
                  <option value="">버전 선택</option>
                  {(frontendOptions[item.framework] || []).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="새 프론트엔드 항목 추가"
      >
        + 프론트엔드 추가
      </button>

      {/* formData.env가 'paas'일 때만 도메인 입력 필드를 렌더링합니다. */}
      {formData.env === 'paas' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <label htmlFor="frontend-domain-input" className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
            프론트 도메인 (필수 항목 X)
          </label>
          <input
            id="frontend-domain-input"
            type="text"
            value={frontendDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
            placeholder="예: www.example.com"
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              domainError ? 'border-red-500' : ''
            }`}
            aria-describedby={domainError ? 'domain-error' : undefined}
          />
          {domainError && (
            <p id="domain-error" className="text-red-500 text-xs mt-1" role="alert">
              도메인 형식이 올바르지 않습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}