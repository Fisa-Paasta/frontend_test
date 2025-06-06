import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import React from 'react';
import {
  SurveyContextType,
  FormDataType,
  K8sConfig,
  VMConfig,
  OSConfig,
  FrontendItem,
  BackendItem,
  WebServerItem,
  DBItem,
  BackendLanguage,
  BackendFramework
} from '@/types/survey';

// ✅ SurveyContext를 export 합니다.
export const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const defaultK8s: K8sConfig = {
    type: '',
    version: '',
    node: '',
    namespace: ''
  };

  const defaultVM: VMConfig = {
    hostname: '',
    username: '',
    environment: 'on-premise',
    ec2Type: '',
    ebsType: ''
  };

  const defaultOS: OSConfig = {
    name: '',
    version: ''
  };

  const initialFormData: FormDataType = {
    env: '',
    k8s: defaultK8s,
    vm: defaultVM,
    resources: { cpu: '', ram: '', disk: '' },
    os: defaultOS,
    frontendItems: [{ id: Date.now(), framework: '', version: '' }],
    frontendDomain: '', // <<<<< 여기에 이 줄을 추가합니다.
    backendItems: [{
      id: Date.now() + 1,
      language: '' as BackendLanguage,
      languageVersion: '',
      framework: '' as BackendFramework,
      frameworkVersion: ''
    }],
    apiDomain: '',
    apiPaths: [''],
    webServerItems: [{ id: Date.now() + 2, server: '', version: '' }],
    dbItems: [{ id: Date.now() + 3, type: '', name: '', version: '', size: '' }],
  };

  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [steps, setSteps] = useState<{ id: number; title: string }[]>([{ id: 0, title: '환경 선택' }]);

  useEffect(() => {
    if (formData.env === 'iaas') {
      setSteps([
        { id: 0, title: '환경 선택' },
        { id: 1, title: 'VM' },
        { id: 2, title: '자원 선택' },
        { id: 3, title: 'OS' },
        { id: 4, title: '프론트엔드' },
        { id: 5, title: '백엔드' },
        { id: 6, title: '웹 서버' },
        { id: 7, title: 'DB' }
      ]);
    } else if (formData.env === 'paas') {
      setSteps([
        { id: 0, title: '환경 선택' },
        { id: 1, title: 'K8s' },
        { id: 2, title: '자원 선택' },
        { id: 3, title: 'OS' },
        { id: 4, title: '프론트엔드' },
        { id: 5, title: '백엔드' },
        { id: 6, title: '웹 서버' },
        { id: 7, title: 'DB' }
      ]);
    } else {
      setSteps([{ id: 0, title: '환경 선택' }]);
    }
  }, [formData.env]);

  const updateFormData = <K extends keyof FormDataType>(key: K, value: FormDataType[K]) => {
    setFormData(prev => {
      if (prev[key] === value) return prev; 
      return { ...prev, [key]: value };
    });
  };

  const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const goToPrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const TOTAL_STEPS = steps.length;

  return (
    <SurveyContext.Provider value={{
      formData,
      updateFormData,
      currentStep,
      setCurrentStep,
      goToNextStep,
      goToPrevStep,
      steps,
      TOTAL_STEPS
    }}>
      {children}
    </SurveyContext.Provider>
  );
}

export const useSurvey = (): SurveyContextType => {
  const context = useContext(SurveyContext);
  if (!context) throw new Error('useSurvey must be used within a SurveyProvider');
  return context;
};