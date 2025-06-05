import { useSurvey } from '@/context/SurveyContext';
import { useState, useEffect } from 'react';
import { OSConfig, OSName } from '@/types/survey'; // Assuming OSConfig and OSName are defined in types/survey
import React from 'react';

// ✅ 컴포넌트 외부로 이동: isValidOSName 함수
// 이 함수는 컴포넌트 렌더링 시마다 재생성될 필요가 없습니다.
const isValidOSName = (name: string): name is Exclude<OSName, ''> => {
  return ['ubuntu', 'rhel', 'suse', 'debian', 'amazon_linux'].includes(name);
};

export default function Step4_OS() {
  const { formData, updateFormData } = useSurvey();

  // OS 옵션 정의 (변동 없음)
  const osOptions: Record<Exclude<OSName, ''>, string[]> = {
    ubuntu: ['20.04.6 (LTS / Focal Fossa)', '22.04.5 (LTS / Jammy Jellyfish)', '24.04.2 (LTS / Noble Numbat)'],
    rhel: ['RHEL 8', 'RHEL 9'],
    suse: ['SUSE Linux 15.6', 'SUSE Linux 12.5'],
    debian: ['Debian 11 "Bullseye"', 'Debian 10 "Buster"', 'Debian 9 "Stretch"'],
    amazon_linux: ['Amazon Linux 2', 'Amazon Linux 2023'],
  };

  // OS 이미지 정보 (변동 없음)
  const osImages: { name: Exclude<OSName, ''>; label: string; src: string }[] = [
    { name: 'ubuntu', label: 'Ubuntu', src: '/img/os/ubuntu.png' },
    { name: 'rhel', label: 'RHEL', src: '/img/os/rhel.png' },
    { name: 'suse', label: 'SUSE', src: '/img/os/suse.png' },
    { name: 'debian', label: 'Debian', src: '/img/os/debian.png' },
    { name: 'amazon_linux', label: 'Amazon Linux', src: '/img/os/amazon.png' },
  ];

  const [localOS, setLocalOS] = useState<OSConfig>(formData.os ?? { name: '', version: '' });

  // localOS 상태가 변경될 때마다 formData 업데이트
  useEffect(() => {
    updateFormData('os', localOS);
  }, [localOS, updateFormData]);

  // OS 클릭 핸들러: 선택/해제 로직
  const handleOSClick = (osName: string) => {
    const currentOS = localOS.name;
    
    // 이미 선택된 OS를 다시 클릭하면 선택 해제
    if (currentOS === osName) {
      const updated = { name: '', version: '' } as OSConfig;
      setLocalOS(updated);
      // console.log(`🔄 ${osName} 선택 해제됨`); // 배포 시 제거 고려
      return;
    }
    
    // 새로운 OS 선택
    // isValidOSName을 사용하여 타입 안전성을 확보
    const validOSName: OSName = isValidOSName(osName) ? osName : '';
    const updated = { name: validOSName, version: '' }; // 새 OS 선택 시 버전 초기화
    setLocalOS(updated);
    // console.log(`✅ ${osName} 선택됨`); // 배포 시 제거 고려
  };

  // OS 버전 변경 핸들러
  const handleVersionChange = (value: string) => {
    const updated = { ...localOS, version: value };
    setLocalOS(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        {/* OS 선택 섹션 */}
        <fieldset>
          <legend className="text-sm font-medium mb-3">
            운영 체제 선택
            {' '}
            <span className="text-xs text-gray-500 ml-2">(선택된 항목을 다시 클릭하면 해제됩니다)</span>
          </legend>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {osImages.map((os) => (
              <button
                key={os.name}
                type="button"
                onClick={() => handleOSClick(os.name)}
                className={`p-3 rounded-lg border-2 cursor-pointer text-center transition shadow-sm block w-full
                  ${localOS.name === os.name
                    ? 'border-violet-500 bg-violet-600 text-white' // 선택되었을 때 스타일
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white' // 선택되지 않았을 때 스타일
                  }
                `}
                aria-pressed={localOS.name === os.name} // 접근성: 선택 상태를 스크린 리더에 알림
                aria-label={`${os.label} ${localOS.name === os.name ? '선택됨 (클릭하여 해제)' : '선택하기'}`}
              >
                <img
                  src={os.src}
                  alt={`${os.label} 로고`}
                  className="w-full h-16 object-contain mb-2"
                />
                <span className="text-sm font-semibold">{os.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* 버전 선택 섹션 (OS가 선택되었을 때만 표시) */}
        {localOS.name && isValidOSName(localOS.name) && (
          <div>
            <label htmlFor="os-version-select" className="block mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              버전 선택
            </label>
            <select
              id="os-version-select"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={localOS.version}
              onChange={(e) => handleVersionChange(e.target.value)}
              aria-label={`${localOS.name} 버전 선택`} // 접근성: 어떤 OS의 버전인지 명확히 알림
            >
              <option value="">버전 선택</option>
              {osOptions[localOS.name].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}