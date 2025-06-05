import React from 'react';
import { useSurvey } from '@/context/SurveyContext';
import { useState, useEffect } from 'react';
import { K8sConfig, ResourcesConfig, VMConfig } from '@/types/survey'; // 필요한 타입 import

// 타입 정의
interface ResourceErrors {
  node: boolean;
  cpu: boolean;
  ram: boolean;
  disk: boolean;
  ebsSize: boolean;
}

interface LocalResources {
  cpu: string;
  ram: string;
  disk: string;
}

interface LocalVM {
  ec2Type: string;
  ebsType: string;
  ebsSize: string;
}

// ✅ 강화된 입력 검증 함수
const validateAndSanitizeInput = (value: string): { isValid: boolean; sanitizedValue: string; hasParseError: boolean } => {
  // 빈 문자열은 허용 (즉, 아직 아무것도 입력하지 않았거나, 유효하지 않은 값을 지웠을 때)
  if (value === '') {
    return { isValid: true, sanitizedValue: '', hasParseError: false };
  }
  
  // 숫자가 아닌 문자 제거
  const numericOnly = value.replace(/\D/g, '');
  
  // 숫자가 전혀 없는 문자열 (예: "abc", "xyz")이 입력된 경우
  if (numericOnly === '') {
    // 이때는 빈 문자열로 정제하되, 파싱 에러가 있다고 알림
    return { isValid: false, sanitizedValue: '', hasParseError: true }; 
  }
  
  const numValue = parseInt(numericOnly, 10);
  
  // 유효성 검사: 숫자로 변환 가능하고 1 이상인지
  const isValid = !isNaN(numValue) && numValue > 0;
  
  return { 
    isValid, 
    // 숫자로만 구성되어 있으면 그 값을 유지
    // 유효성(isValid)과 관계없이 사용자에게 보여줄 '정제된' 값은 numericOnly
    sanitizedValue: numericOnly, 
    // hasParseError는 !isValid와 동일하게 유지.
    // 즉, 0이나 음수도 hasParseError가 true가 되어 에러 메시지가 표시됨
    hasParseError: !isValid 
  };
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

// 에러 메시지 컴포넌트
const ErrorMessage = ({ id, message }: { id: string; message: string }) => (
  <p id={id} className="text-red-500 text-xs mt-1" role="alert">
    {message}
  </p>
);

// 입력 필드 컴포넌트
const NumberInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  onPaste, // onPaste prop은 그대로 유지
  placeholder, 
  hasError, 
  errorMessage 
}: {
  id: string;
  label: string;
  value: string;
  // onChange prop의 타입 변경: 이제 sanitizedValue만 받도록 함 (내부에서 validate를 수행하지 않음)
  onChange: (value: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  hasError: boolean;
  errorMessage: string;
}) => (
  <div>
    <label htmlFor={id} className="block mb-1 text-sm font-medium">{label}</label>
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      // NumberInput의 onChange는 이제 NumberInput을 사용하는 부모 컴포넌트의 래퍼 함수를 호출합니다.
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
        hasError ? 'border-red-500' : ''
      }`}
      placeholder={placeholder}
      aria-describedby={hasError ? `${id}-error` : undefined}
    />
    {hasError && <ErrorMessage id={`${id}-error`} message={errorMessage} />}
  </div>
);

// 선택 필드 컴포넌트
const SelectField = ({ 
  id, 
  label, 
  value, 
  onChange, 
  options 
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div>
    <label htmlFor={id} className="block mb-1 text-sm font-medium">{label}</label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// EKS 환경 렌더링 컴포넌트
const EKSResourceFields = ({ 
  localVM, 
  errors, 
  handleVmChange, // handleVmChange는 이제 래퍼 함수 (onVmChange)로 대체될 예정
  handlePaste
}: {
  localVM: LocalVM;
  errors: ResourceErrors;
  // handleVmChange의 타입 변경: 래퍼 함수를 받도록 (value만)
  handleVmChange: (field: keyof LocalVM, value: string) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>, field: string) => void;
}) => {
  const ec2Options = [
    { value: '', label: '선택하세요' },
    { value: 't2.small', label: 't2.small (1vCPU X 2GiB)' },
    { value: 't3.medium', label: 't3.medium (2vCPU X 4GiB)' },
    { value: 't3.large', label: 't3.large (2vCPU X 8GiB)' },
    { value: 't4g.xlarge', label: 't4g.xlarge (4vCPU X 16GiB)' },
    { value: 'm5.large', label: 'm5.large (2vCPU X 8GiB)' }
  ];

  const ebsOptions = [
    { value: '', label: '선택하세요' },
    { value: 'gp3', label: 'gp3 (SSD)' },
    { value: 'gp2', label: 'gp2 (SSD)' },
    { value: 'io1', label: 'io1 (IOPS SSD)' },
    { value: 'io2', label: 'io2 (IOPS SSD)' },
    { value: 'st1', label: 'st1 (HDD)' },
    { value: 'sc1', label: 'sc1 (HDD)' }
  ];

  return (
    <>
      <SelectField
        id="ec2-instance-select"
        label="EC2 인스턴스 타입"
        value={localVM.ec2Type}
        onChange={(value) => handleVmChange('ec2Type', value)} // onVmChange가 전달됨
        options={ec2Options}
      />

      <SelectField
        id="ebs-volume-select"
        label="EBS 볼륨 타입"
        value={localVM.ebsType}
        onChange={(value) => handleVmChange('ebsType', value)} // onVmChange가 전달됨
        options={ebsOptions}
      />

      <NumberInput
        id="ebs-size-input"
        label="EBS 볼륨 크기 (GB)"
        value={localVM.ebsSize}
        onChange={(value) => handleVmChange('ebsSize', value)} // onVmChange가 전달됨
        onPaste={(e) => handlePaste(e, 'ebsSize')}
        placeholder="예: 50"
        hasError={errors.ebsSize}
        errorMessage="EBS 볼륨 크기는 1 이상의 양수를 입력해주세요."
      />
    </>
  );
};

// 온프레미스 환경 렌더링 컴포넌트
const OnPremiseResourceFields = ({ 
  localResources, 
  errors, 
  handleResourceChange, // handleResourceChange는 이제 래퍼 함수 (onResourceChange)로 대체될 예정
  handlePaste
}: {
  localResources: LocalResources;
  errors: ResourceErrors;
  // handleResourceChange의 타입 변경: 래퍼 함수를 받도록 (value만)
  handleResourceChange: (field: keyof LocalResources, value: string) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>, field: string) => void;
}) => (
  <>
    <NumberInput
      id="cpu-cores-input"
      label="CPU (cores)"
      value={localResources.cpu}
      onChange={(value) => handleResourceChange('cpu', value)} // onResourceChange가 전달됨
      onPaste={(e) => handlePaste(e, 'cpu')}
      placeholder="예: 4"
      hasError={errors.cpu}
      errorMessage="CPU는 1 이상의 양수를 입력해주세요."
    />

    <NumberInput
      id="ram-gb-input"
      label="RAM (GB)"
      value={localResources.ram}
      onChange={(value) => handleResourceChange('ram', value)} // onResourceChange가 전달됨
      onPaste={(e) => handlePaste(e, 'ram')}
      placeholder="예: 16"
      hasError={errors.ram}
      errorMessage="RAM은 1 이상의 양수를 입력해주세요."
    />

    <NumberInput
      id="disk-gb-input"
      label="DISK (GB)"
      value={localResources.disk}
      onChange={(value) => handleResourceChange('disk', value)} // onResourceChange가 전달됨
      onPaste={(e) => handlePaste(e, 'disk')}
      placeholder="예: 100"
      hasError={errors.disk}
      errorMessage="DISK는 1 이상의 양수를 입력해주세요."
    />
  </>
);

export default function Step3_Resources() {
  const { formData, updateFormData } = useSurvey();
  const initialK8s = formData.k8s ?? {};
  const initialRes = formData.resources ?? {};
  const initialVM = formData.vm ?? {};

  const [localResources, setLocalResources] = useState<LocalResources>({
    cpu: initialRes.cpu ?? '',
    ram: initialRes.ram ?? '',
    disk: initialRes.disk ?? ''
  });

  const [localVM, setLocalVM] = useState<LocalVM>({
    ec2Type: initialVM.ec2Type ?? '',
    ebsType: initialVM.ebsType ?? '',
    ebsSize: initialVM.ebsSize ?? ''
  });

  const [errors, setErrors] = useState<ResourceErrors>({
    node: false,
    cpu: false,
    ram: false,
    disk: false,
    ebsSize: false
  });

  const isEksEnvironment = initialK8s.type === 'amazon_eks';

  // 이펙트 훅들
  useEffect(() => {
    updateFormData('resources', {
      ...formData.resources,
      ...localResources
    });
  }, [localResources, formData.resources, updateFormData]);

  useEffect(() => {
    updateFormData('vm', {
      ...formData.vm,
      ...localVM
    });
  }, [localVM, formData.vm, updateFormData]);

  // ✅ 수정된 이벤트 핸들러들 - 유효성 검사 결과를 인자로 받음
  const _handleResourceChange = (field: keyof LocalResources, value: string, isValid: boolean, hasParseError: boolean) => {
    setErrors(prev => ({ ...prev, [field]: hasParseError || (!isValid && value !== '') }));
    setLocalResources(prev => ({ ...prev, [field]: value })); // sanitizedValue가 이미 넘어오므로 그대로 사용
  };

  const _handleVmChange = (field: keyof LocalVM, value: string, isValid: boolean, hasParseError: boolean) => {
    if (field === 'ebsSize') {
      setErrors(prev => ({ ...prev, ebsSize: hasParseError || (!isValid && value !== '') }));
      setLocalVM(prev => ({ ...prev, [field]: value })); // sanitizedValue가 이미 넘어오므로 그대로 사용
    } else {
      setLocalVM(prev => ({ ...prev, [field]: value }));
    }
  };

  const _handleNodeChange = (value: string, isValid: boolean, hasParseError: boolean) => {
    setErrors(prev => ({ ...prev, node: hasParseError || (!isValid && value !== '') }));
    updateFormData('k8s', { ...formData.k8s, node: value }); // sanitizedValue가 이미 넘어오므로 그대로 사용
  };

  // ✅ 변경된 onChange 핸들러들: validateAndSanitizeInput 호출 후 결과를 하위 핸들러에 전달
  // 이 함수들은 NumberInput의 onChange prop에 직접 연결됩니다.
  const onNodeChange = (value: string) => {
    const { isValid, sanitizedValue, hasParseError } = validateAndSanitizeInput(value);
    _handleNodeChange(sanitizedValue, isValid, hasParseError);
  };

  const onResourceChange = (field: keyof LocalResources, value: string) => {
    const { isValid, sanitizedValue, hasParseError } = validateAndSanitizeInput(value);
    _handleResourceChange(field, sanitizedValue, isValid, hasParseError);
  };

  const onVmChange = (field: keyof LocalVM, value: string) => {
    if (field === 'ebsSize') { // EBS Size만 숫자 입력
      const { isValid, sanitizedValue, hasParseError } = validateAndSanitizeInput(value);
      _handleVmChange(field, sanitizedValue, isValid, hasParseError);
    } else { // 그 외 VM 필드는 일반 문자열이므로 유효성 검사 필요 없음
      _handleVmChange(field, value, true, false); // 유효한 것으로 간주
    }
  };

  // ✅ 붙여넣기 이벤트 핸들러 - 숫자만 허용 (최종 수정)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, field: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // 붙여넣기된 텍스트에 대해 한 번만 유효성 검사 수행
    const { isValid, sanitizedValue, hasParseError } = validateAndSanitizeInput(pastedText);

    if (field === 'node') {
      _handleNodeChange(sanitizedValue, isValid, hasParseError); // 검사 결과를 그대로 전달
    } else if (field === 'ebsSize') {
      _handleVmChange(field, sanitizedValue, isValid, hasParseError); // 검사 결과를 그대로 전달
    } else { // cpu, ram, disk
      _handleResourceChange(field as keyof LocalResources, sanitizedValue, isValid, hasParseError); // 검사 결과를 그대로 전달
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <NumberInput
          id="worker-nodes-input"
          label="Worker Node 수"
          value={formData.k8s?.node ?? ''}
          onChange={onNodeChange} // 변경된 onChange 핸들러 사용
          onPaste={(e) => handlePaste(e, 'node')}
          placeholder="예: 3"
          hasError={errors.node}
          errorMessage="Worker Node 수는 1 이상의 양수를 입력해주세요."
        />
        
        {isEksEnvironment ? (
          <EKSResourceFields 
            localVM={localVM} 
            errors={errors} 
            handleVmChange={onVmChange} // 변경된 onChange 핸들러 사용
            handlePaste={handlePaste}
          />
        ) : (
          <OnPremiseResourceFields 
            localResources={localResources} 
            errors={errors} 
            handleResourceChange={onResourceChange} // 변경된 onChange 핸들러 사용
            handlePaste={handlePaste}
          />
        )}
      </div>
    </div>
  );
}