import { useSurvey } from '@/context/SurveyContext';
import { useState, useEffect } from 'react';
import { K8sConfig, OrchestrationType } from '@/types/survey'; // OrchestrationType 임포트 확인
import React from 'react';

export default function Step2_K8s() {
  const { formData, updateFormData } = useSurvey();

  const [errors, setErrors] = useState({
    type: false,
    namespace: false
  });

  // orchestrationOptions의 value 타입을 OrchestrationType으로 명시합니다.
  const orchestrationOptions: { value: OrchestrationType, label: string }[] = [
    { value: '', label: '선택' },  // '선택' 옵션을 빈 값으로 설정
    { value: 'kubernetes', label: 'On-premise Kubernetes' },
    { value: 'amazon_eks', label: 'Amazon EKS' },
    { value: 'google_gke', label: 'Google GKE' },
    { value: 'azure_aks', label: 'Azure AKS' }
  ];

  const [localK8s, setLocalK8s] = useState<K8sConfig>({
    type: (formData.k8s?.type || '') as OrchestrationType,  // 기본값을 ''로 설정
    version: formData.k8s?.version || '', // formData에서 version 값도 가져오도록 추가 (필요시)
    node: formData.k8s?.node || '',
    namespace: formData.k8s?.namespace || ''
  });

  // localK8s 상태가 변경될 때마다 updateFormData를 호출합니다.
  useEffect(() => {
    // 깊은 비교를 통해 실제 변경이 있을 때만 updateFormData를 호출하여 불필요한 렌더링 방지
    // 이 부분은 필요에 따라 제거하거나 다른 비교 방식으로 변경할 수 있습니다.
    if (JSON.stringify(localK8s) !== JSON.stringify(formData.k8s)) {
        updateFormData('k8s', localK8s);
    }
  }, [localK8s, updateFormData, formData.k8s]); // updateFormData와 formData.k8s를 의존성 배열에 추가

  // field는 K8sConfig의 키, value는 string.
  const handleChange = (field: keyof K8sConfig, value: string) => {
    // **모든 필드에 대해 localK8s 상태를 먼저 업데이트합니다.**
    // value의 타입이 K8sConfig의 해당 field 타입과 일치하도록 단언해줍니다.
    setLocalK8s(prev => ({
      ...prev,
      [field]: value as K8sConfig[typeof field]
    }));

    // **그 다음, 필드별로 유효성 검사 및 에러 상태를 업데이트합니다.**
    if (field === 'namespace') {
      if (value && !/^[a-zA-Z][-a-zA-Z0-9]*$/.test(value)) {
        setErrors(prev => ({ ...prev, [field]: true }));
      } else {
        setErrors(prev => ({ ...prev, [field]: false }));
      }
    } else if (field === 'type') {
      // 'type' 필드는 select 박스이므로, 값이 비어있으면 에러로 처리
      setErrors(prev => ({ ...prev, [field]: !value }));
    } else { // 기타 필드 (현재 코드에서는 'node'와 'version'이 해당)
      setErrors(prev => ({ ...prev, [field]: !value }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">

        {/* 오케스트레이션 선택 */}
        <div>
          <label htmlFor="orchestration-select" className="block mb-1 text-sm font-medium">컨테이너 오케스트레이션</label>
          <select
            id="orchestration-select"
            value={localK8s.type}
            onChange={(e) => handleChange('type', e.target.value)} // e.target.value는 string으로 들어오므로, handleChange 내부에서 타입 변환 처리
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white ${errors.type ? 'border-red-500' : ''}`}
          >
            {orchestrationOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.type && <p className="text-red-500 text-xs mt-1">오케스트레이션을 선택하세요.</p>}
        </div>

        {/* Namespace Prefix */}
        <div>
          <label htmlFor="namespace-input" className="block mb-1 text-sm font-medium">Namespace Prefix</label>
          <input
            id="namespace-input"
            type="text"
            value={localK8s.namespace}
            onChange={(e) => handleChange('namespace', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white ${errors.namespace ? 'border-red-500' : ''}`}
            placeholder="예: team-alpha"
          />
          {errors.namespace && (
            <p className="text-red-500 text-xs mt-1">
              영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}