import { useSurvey } from '@/context/SurveyContext';
import { useState, useEffect } from 'react';
import React from 'react';

export default function Step3_VMResources() {
  const { formData, updateFormData } = useSurvey();
  const initialVM = formData.vm || {};
  const initialRes = formData.resources || {};

  const [localVM, setLocalVM] = useState({
    environment: initialVM.environment || 'on-premise',
    ec2Type: initialVM.ec2Type || '',
    ebsType: initialVM.ebsType || '',
    ebsSize: initialVM.ebsSize || ''
  });

  const [localResources, setLocalResources] = useState({
    cpu: initialRes.cpu || '',
    ram: initialRes.ram || '',
    disk: initialRes.disk || ''
  });

  // ✅ 유효성 검사 상태 추가
  const [errors, setErrors] = useState({
    cpu: false,
    ram: false,
    disk: false,
    ebsSize: false
  });

  useEffect(() => {
    updateFormData('vm', {
      ...formData.vm,
      ...localVM
    });
  }, [localVM]);

  useEffect(() => {
    updateFormData('resources', {
      ...formData.resources,
      ...localResources
    });
  }, [localResources]);

// ✅ 강화된 입력 검증 함수 (수정)
const validateAndSanitizeInput = (value: string): { isValid: boolean; sanitizedValue: string } => {
  // 빈 문자열은 허용합니다.
  if (value === '') {
    return { isValid: true, sanitizedValue: '' };
  }

  // **핵심 수정 부분:**
  // 1. value.includes('-')로 음수 기호가 포함되었는지 확인합니다.
  // 2. !/^\d*$/.test(value)로 value가 순수하게 숫자(0-9)로만 구성되어 있는지 확인합니다.
  //    만약 숫자가 아닌 다른 문자가 포함되어 있다면 (예: 'abc', '123a') 유효하지 않습니다.
  if (value.includes('-') || !/^\d*$/.test(value)) {
    // 음수 기호가 있거나 순수 숫자가 아니라면 유효하지 않으므로,
    // 필드를 비우고 오류 처리를 위해 { isValid: false, sanitizedValue: '' }를 반환합니다.
    return { isValid: false, sanitizedValue: '' };
  }

  // 이 시점에 도달했다면, `value`는 순수하게 숫자 문자열(예: "123", "")만 포함합니다.
  const numValue = parseInt(value, 10);
  
  // 숫자인지 확인하고 0보다 큰 양수인지 최종 검증합니다.
  const isValid = !isNaN(numValue) && numValue > 0;
  
  // 유효하면 원래의 숫자 문자열(이제 순수 숫자만 남았음)을 사용하고, 아니면 비웁니다.
  return { 
    isValid, 
    sanitizedValue: isValid ? value : '' 
  };
};

// handleVmChange 및 handleResourceChange 함수는 이미 이전 답변에서 올바르게 설정된 것으로 가정합니다.
// 중요: setErrors를 호출할 때 `!isValid && value !== ''` 조건을 사용해야 합니다.
// 이렇게 해야 유효하지 않으면서 동시에 비어있지 않은(즉, 무언가 입력됐는데 잘못된) 경우에만 오류가 표시됩니다.
const handleVmChange = (field: 'environment' | 'ec2Type' | 'ebsType' | 'ebsSize', value: string) => {
    if (field === 'ebsSize') {
        const { isValid, sanitizedValue } = validateAndSanitizeInput(value);
        setErrors(prev => ({ ...prev, ebsSize: !isValid && value !== '' }));
        setLocalVM(prev => ({ ...prev, [field]: sanitizedValue }));
    } else {
        setLocalVM(prev => ({ ...prev, [field]: value }));
    }
};

const handleResourceChange = (field: 'cpu' | 'ram' | 'disk', value: string) => {
    const { isValid, sanitizedValue } = validateAndSanitizeInput(value);
    setErrors(prev => ({ ...prev, [field]: !isValid && value !== '' }));
    setLocalResources(prev => ({ ...prev, [field]: sanitizedValue }));
};

  // ✅ 키보드 입력 이벤트 핸들러 - 음수 기호와 문자 입력 차단
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 허용할 키: 숫자, 백스페이스, 삭제, 탭, 화살표 키, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    const isNumber = e.key >= '0' && e.key <= '9';
    const isAllowedKey = allowedKeys.includes(e.key);
    const isCtrlKey = e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase());
    
    // 음수 기호(-), 점(.), 문자 등 차단
    if (!isNumber && !isAllowedKey && !isCtrlKey) {
      e.preventDefault();
    }
  };

  // ✅ 붙여넣기 이벤트 핸들러 - 숫자만 허용
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, field: string) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text'); // Original pasted text, e.g., '-100'
    
      // **핵심 수정 부분:**
      // numericOnly를 여기서 바로 만들지 않고, validateAndSanitizeInput에 원본 pastedText를 전달합니다.
      // validateAndSanitizeInput이 음수 기호나 다른 비숫자 문자를 포함한 원본 텍스트를 검증합니다.
      if (field.startsWith('vm_')) {
        const vmField = field.replace('vm_', '') as 'ebsSize';
        const { isValid, sanitizedValue } = validateAndSanitizeInput(pastedText); // Pass original text
        setErrors(prev => ({ ...prev, [vmField]: !isValid && pastedText !== '' })); // Check error based on original text
        setLocalVM(prev => ({ ...prev, [vmField]: sanitizedValue }));
      } else {
        const { isValid, sanitizedValue } = validateAndSanitizeInput(pastedText); // Pass original text
        setErrors(prev => ({ ...prev, [field as 'cpu' | 'ram' | 'disk']: !isValid && pastedText !== '' })); // Check error based on original text
        setLocalResources(prev => ({ ...prev, [field as 'cpu' | 'ram' | 'disk']: sanitizedValue }));
      }
    };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div>
          <label htmlFor="environment-select" className="block mb-1 text-sm font-medium">환경</label>
          <select
            id="environment-select"
            value={localVM.environment}
            onChange={(e) => handleVmChange('environment', e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white"
          >
            <option value="on-premise">On-premise</option>
            <option value="aws">AWS</option>
          </select>
        </div>

        {localVM.environment === 'on-premise' && (
          <>
            <div>
              <label htmlFor="cpu-cores-input" className="block mb-1 text-sm font-medium">CPU (cores)</label>
              <input
                id="cpu-cores-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localResources.cpu}
                onChange={(e) => handleResourceChange('cpu', e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={(e) => handlePaste(e, 'cpu')}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.cpu ? 'border-red-500' : ''
                }`}
                placeholder="예: 4"
                aria-describedby={errors.cpu ? 'cpu-error' : undefined}
              />
              {errors.cpu && (
                <p id="cpu-error" className="text-red-500 text-xs mt-1" role="alert">
                  CPU는 1 이상의 양수를 입력해주세요.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ram-gb-input" className="block mb-1 text-sm font-medium">RAM (GB)</label>
              <input
                id="ram-gb-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localResources.ram}
                onChange={(e) => handleResourceChange('ram', e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={(e) => handlePaste(e, 'ram')}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.ram ? 'border-red-500' : ''
                }`}
                placeholder="예: 16"
                aria-describedby={errors.ram ? 'ram-error' : undefined}
              />
              {errors.ram && (
                <p id="ram-error" className="text-red-500 text-xs mt-1" role="alert">
                  RAM은 1 이상의 양수를 입력해주세요.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="disk-gb-input" className="block mb-1 text-sm font-medium">DISK (GB)</label>
              <input
                id="disk-gb-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localResources.disk}
                onChange={(e) => handleResourceChange('disk', e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={(e) => handlePaste(e, 'disk')}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.disk ? 'border-red-500' : ''
                }`}
                placeholder="예: 100"
                aria-describedby={errors.disk ? 'disk-error' : undefined}
              />
              {errors.disk && (
                <p id="disk-error" className="text-red-500 text-xs mt-1" role="alert">
                  DISK는 1 이상의 양수를 입력해주세요.
                </p>
              )}
            </div>
          </>
        )}

        {localVM.environment === 'aws' && (
          <>
            <div>
              <label htmlFor="ec2-instance-select" className="block mb-1 text-sm font-medium">EC2 인스턴스 타입</label>
              <select
                id="ec2-instance-select"
                value={localVM.ec2Type}
                onChange={(e) => handleVmChange('ec2Type', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white"
              >
                <option value="">선택하세요</option>
                <option value="t2.small">t2.small (1vCPU X 2GiB)</option>
                <option value="t3.medium">t3.medium (2vCPU X 4GiB)</option>
                <option value="t3.large">t3.large (2vCPU X 8GiB)</option>
                <option value="t4g.xlarge">t4g.xlarge (4vCPU X 16GiB)</option>
                <option value="m5.large">m5.large (2vCPU X 8GiB)</option>
              </select>
            </div>

            <div>
              <label htmlFor="ebs-volume-select" className="block mb-1 text-sm font-medium">EBS 볼륨 타입</label>
              <select
                id="ebs-volume-select"
                value={localVM.ebsType}
                onChange={(e) => handleVmChange('ebsType', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white"
              >
                <option value="">선택하세요</option>
                <option value="gp3">gp3 (SSD)</option>
                <option value="gp2">gp2 (SSD)</option>
                <option value="io1">io1 (IOPS SSD)</option>
                <option value="io2">io2 (IOPS SSD)</option>
                <option value="st1">st1 (HDD)</option>
                <option value="sc1">sc1 (HDD)</option>
              </select>
            </div>

            <div>
              <label htmlFor="ebs-size-input" className="block mb-1 text-sm font-medium">EBS 볼륨 크기 (GB)</label>
              <input
                id="ebs-size-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localVM.ebsSize || ''}
                onChange={(e) => handleVmChange('ebsSize', e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={(e) => handlePaste(e, 'vm_ebsSize')}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.ebsSize ? 'border-red-500' : ''
                }`}
                placeholder="예: 50"
                aria-describedby={errors.ebsSize ? 'ebs-size-error' : undefined}
              />
              {errors.ebsSize && (
                <p id="ebs-size-error" className="text-red-500 text-xs mt-1" role="alert">
                  EBS 볼륨 크기는 1 이상의 양수를 입력해주세요.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}