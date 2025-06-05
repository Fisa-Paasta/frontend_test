import React from 'react';
import { useSurvey } from '@/context/SurveyContext';
import { useState } from 'react';
import Step1_Env from './FormStep/Step1_Env';
import Step2_K8s from './FormStep/Step2_K8s';
import Step2_VM from './FormStep/Step2_VM';
import Step3_Resources from './FormStep/Step3_Resources';
import Step3_VMResources from './FormStep/Step3_VMResources';
import Step4_OS from './FormStep/Step4_OS';
import Step5_Frontend from './FormStep/Step5_Frontend';
import Step6_Backend from './FormStep/Step6_Backend';
import Step7_WebServer from './FormStep/Step7_WebServer';
import Step8_DB from './FormStep/Step8_DB';
import ConfirmModal from './ConfirmModal';
import InformationModal from './InformationModal';
import { useSubmitted } from '@/context/SubmittedContext';
import { SurveyContextType } from '@/types/survey';
import { useNavigate } from 'react-router-dom';


// 검증 로직을 별도 함수들로 분리하여 복잡도 감소
const validateStep0 = (formData: any): boolean => {
  return !!formData.env;
};

const validateIaaSHostname = (hostname?: string): boolean => {
  return /^[a-zA-Z][-a-zA-Z0-9]*$/.test(hostname ?? '');
};

const validateIaaSUsername = (username?: string): boolean => {
  return /^[a-zA-Z][-a-zA-Z0-9]*$/.test(username ?? '');
};

const validateStep1IaaS = (formData: any): boolean => {
  return validateIaaSHostname(formData.vm.hostname) && validateIaaSUsername(formData.vm.username);
};

const validatePaaSType = (type?: string): boolean => {
  return !!type;
};

const validatePaaSNamespace = (namespace?: string): boolean => {
  return !!namespace && /^[a-zA-Z][-a-zA-Z0-9]*$/.test(namespace);
};

const validateStep1PaaS = (formData: any): boolean => {
  return validatePaaSType(formData.k8s?.type) && validatePaaSNamespace(formData.k8s?.namespace);
};

const validateStep1 = (formData: any): boolean => {
  if (formData.env === 'iaas') {
    return validateStep1IaaS(formData);
  }
  if (formData.env === 'paas') {
    return validateStep1PaaS(formData);
  }
  return false;
};

const validateResource = (value?: string): boolean => {
  const num = parseInt(value ?? '', 10);
  return !isNaN(num) && num > 0;
};

const validateIaaSOnPremResources = (formData: any): boolean => {
  return validateResource(formData.resources.cpu) && 
         validateResource(formData.resources.ram) && 
         validateResource(formData.resources.disk);
};

const validateIaaSAwsResources = (formData: any): boolean => {
  return !!formData.vm.ec2Type && 
         !!formData.vm.ebsType && 
         validateResource(formData.vm.ebsSize);
};

const validateIaaSResources = (formData: any): boolean => {
  return formData.vm.environment === 'on-premise' 
    ? validateIaaSOnPremResources(formData)
    : validateIaaSAwsResources(formData);
};

const validatePaaSEksResources = (formData: any): boolean => {
  return validateResource(formData.k8s?.node) && 
         !!formData.vm.ec2Type && 
         !!formData.vm.ebsType && 
         validateResource(formData.vm.ebsSize);
};

const validatePaaSOnPremResources = (formData: any): boolean => {
  return validateResource(formData.k8s?.node) && 
         validateResource(formData.resources.cpu) && 
         validateResource(formData.resources.ram) && 
         validateResource(formData.resources.disk);
};

const validatePaaSResources = (formData: any): boolean => {
  return formData.k8s?.type === 'amazon_eks' 
    ? validatePaaSEksResources(formData)
    : validatePaaSOnPremResources(formData);
};

const validateStep2 = (formData: any): boolean => {
  return formData.env === 'iaas' 
    ? validateIaaSResources(formData)
    : validatePaaSResources(formData);
};

const validateStep3 = (formData: any): boolean => {
  return !!formData.os?.name && !!formData.os?.version;
};

const validateFrontendItems = (items?: any[]): boolean => {
  return items?.every((item: any) => {
    const fw = item.framework?.trim();
    return !fw || !!item.version?.trim();
  }) ?? true;
};

const validateStep4 = (formData: any): boolean => {
  return validateFrontendItems(formData.frontendItems);
};

const validateBackendItems = (items?: any[]): boolean => {
  return items?.every((item: any) => {
    const langOk = !item.language || (item.language && item.languageVersion);
    const fwOk = !item.framework || (item.framework && item.frameworkVersion);
    return langOk && fwOk;
  }) ?? true;
};

const validatePaaSBackendDomain = (domain?: string): boolean => {
  return !!domain && /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(domain);
};

const validatePaaSBackendPaths = (paths?: string[]): boolean => {
  return (paths?.length ?? 0) > 0 && 
    paths?.every((path: string) => /^\/[a-zA-Z0-9/_-]+$/.test(path.trim())) === true;
};

const validatePaaSBackend = (formData: any): boolean => {
  const hasFramework = formData.backendItems?.some((item: any) => !!item.framework);
  if (!hasFramework) return true;
  
  return validatePaaSBackendDomain(formData.apiDomain) && 
         validatePaaSBackendPaths(formData.apiPaths);
};

const validateStep5 = (formData: any): boolean => {
  const backendValid = validateBackendItems(formData.backendItems);
  return formData.env === 'paas' 
    ? backendValid && validatePaaSBackend(formData)
    : backendValid;
};

const validateWebServerItems = (items?: any[]): boolean => {
  return items?.every((item: any) => {
    const isEmpty = !item.server && !item.version;
    return isEmpty || (!!item.server && !!item.version);
  }) ?? true;
};

const validateStep6 = (formData: any): boolean => {
  return validateWebServerItems(formData.webServerItems);
};

const validateDBItems = (items?: any[]): boolean => {
  return items?.every((item: any) => {
    const isEmpty = !item.type && !item.name && !item.version && !item.size;
    return isEmpty || (!!item.type && !!item.name && !!item.version && !!item.size);
  }) ?? true;
};

const validateStep7 = (formData: any): boolean => {
  return validateDBItems(formData.dbItems);
};

export default function FormStep() {
  const {
    currentStep,
    goToNextStep,
    goToPrevStep,
    formData,
    TOTAL_STEPS
  }: SurveyContextType = useSurvey();

  const { addSubmittedCard } = useSubmitted();
  const navigate = useNavigate();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepsByEnv = {
    iaas: [Step1_Env, Step2_VM, Step3_VMResources, Step4_OS, Step5_Frontend, Step6_Backend, Step7_WebServer, Step8_DB],
    paas: [Step1_Env, Step2_K8s, Step3_Resources, Step4_OS, Step5_Frontend, Step6_Backend, Step7_WebServer, Step8_DB]
  };

  const getStepComponent = () => {
    if (formData.env === 'iaas') {
      return stepsByEnv.iaas[currentStep];
    }
    if (formData.env === 'paas') {
      return stepsByEnv.paas[currentStep];
    }
    return Step1_Env;
  };

  const StepComponent = getStepComponent();

  const handleNext = () => {
    if (!isCurrentStepValid()) return;
    
    if (currentStep === TOTAL_STEPS - 1) {
      setShowInfoModal(true);
    } else {
      goToNextStep();
    }
  };

  const handleConfirmSubmit = async ({ title, description }: { title: string; description: string }) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const userId = localStorage.getItem('userId')!;
      const newCard = {
        title,
        desc: description?.trim() ?? '—',
        date: new Date().toISOString().split('T')[0],
        starred: false,
        status: '접수중' as const,
        historyList: [],
        formDataSnapshot: { ...formData, userId },
      };

      await addSubmittedCard(newCard);
      
      alert('✅ 신청서가 성공적으로 제출되었습니다!');
      setShowConfirmModal(false);
      navigate('/home');
      
    } catch (err) {
      console.error('❌ 신청서 제출 실패:', err);
      alert('❌ 신청서 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentStepValid = (): boolean => {
    const validators = [
      validateStep0,
      validateStep1,
      validateStep2,
      validateStep3,
      validateStep4,
      validateStep5,
      validateStep6,
      validateStep7
    ];

    const validator = validators[currentStep];
    return validator ? validator(formData) : true;
  };

  const getNextButtonText = () => {
    if (isSubmitting) return '제출 중...';
    if (currentStep === TOTAL_STEPS - 1) return '확인 ✓';
    return '다음 →';
  };

  return (
    <>
      <StepComponent />

      <div className="flex justify-between items-center mt-8 px-4">
        <button
          type="button"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${currentStep === 0
            ? 'opacity-0 cursor-default'
            : 'bg-white dark:bg-panel-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-opacity-80 shadow-sm border border-border-light dark:border-border-dark'
            }`}
        >
          ← 이전
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid() || isSubmitting}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${!isCurrentStepValid() || isSubmitting
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-primary hover:bg-primary-hover text-white shadow-sm'
            }`}
        >
          {getNextButtonText()}
        </button>
      </div>

      {showInfoModal && (
        <InformationModal
          onClose={() => setShowInfoModal(false)}
          onSubmit={() => {
            setShowInfoModal(false);
            setShowConfirmModal(true);
          } } isOpen={false} title={''} message={''} icon={'error'}        />
      )}

      {showConfirmModal && (
        <ConfirmModal
          onBack={() => {
            setShowConfirmModal(false);
            setShowInfoModal(true);
          }}
          onClose={() => setShowConfirmModal(false)}
          onSubmit={handleConfirmSubmit}
        />
      )}
    </>
  );
}