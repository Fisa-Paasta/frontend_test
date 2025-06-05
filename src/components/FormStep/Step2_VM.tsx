import React from 'react';
import { useSurvey } from '@/context/SurveyContext';
import { useState, useEffect } from 'react';
import { VMConfig } from '@/types/survey';

export default function Step2_VM() {
  const { formData, updateFormData } = useSurvey();

  const [errors, setErrors] = useState({
    hostname: false,
    username: false,
  });

  const [localVM, setLocalVM] = useState<VMConfig>({
    hostname: formData.vm?.hostname || '',
    username: formData.vm?.username || '',
    environment: (formData.vm?.environment || 'on-premise') as 'on-premise' | 'aws',
    ec2Type: formData.vm?.ec2Type || '',
    ebsType: formData.vm?.ebsType || '',
  });

  useEffect(() => {
    updateFormData('vm', localVM);
  }, [localVM, updateFormData]);

  const handleChange = (field: keyof VMConfig, value: string) => {
    if (field === 'hostname' || field === 'username') {
      const isValid = value === '' || /^[a-zA-Z][-a-zA-Z0-9]*$/.test(value);
      setErrors((prev) => ({ ...prev, [field]: !isValid }));
    }

    setLocalVM((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div>
          <label htmlFor="hostname-input" className="block mb-1 text-sm font-medium">호스트네임</label>
          <input
            id="hostname-input"
            type="text"
            value={localVM.hostname}
            onChange={(e) => handleChange('hostname', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white ${errors.hostname ? 'border-red-500' : ''}`}
            placeholder="예: my-vm-host"
          />
          {errors.hostname && (
            <p className="text-red-500 text-xs mt-1">
              영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="username-input" className="block mb-1 text-sm font-medium">사용자 이름</label>
          <input
            id="username-input"
            type="text"
            value={localVM.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white ${errors.username ? 'border-red-500' : ''}`}
            placeholder="예: ubuntu"
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">
              영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}