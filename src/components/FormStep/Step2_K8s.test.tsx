import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step2_K8s from '@/components/FormStep/Step2_K8s'; // 실제 경로에 맞게 수정
import { SurveyProvider } from '@/context/SurveyContext'; // SurveyProvider 임포트
import { FormDataType } from '@/types/survey'; // 필요한 타입 임포트
import { OrchestrationType } from '@/types/survey';

// useSurvey 훅의 Mock 구현을 위한 spyOn
const mockUpdateFormData = jest.fn();
const mockSetCurrentStep = jest.fn();

// SurveyContext의 초기 formData와 유사한 mock 데이터 정의
const mockInitialFormData: FormDataType = {
  env: 'paas',
  k8s: { type: '' as OrchestrationType, version: '', node: '', namespace: '' }, // OrchestrationType으로 빈 문자열 허용
  vm: { hostname: '', username: '', environment: 'on-premise', ec2Type: '', ebsType: '' },
  resources: { cpu: '', ram: '', disk: '' },
  os: { name: '', version: '' },
  frontendItems: [],
  frontendDomain: '',
  backendItems: [],
  apiDomain: '',
  apiPaths: [''],
  webServerItems: [],
  dbItems: [],
};

describe('Step2_K8s', () => {
  beforeEach(() => {
    mockUpdateFormData.mockClear();
    mockSetCurrentStep.mockClear();

    // 모든 테스트를 위해 useSurvey 훅을 기본값으로 목킹
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: mockInitialFormData,
      updateFormData: mockUpdateFormData,
      setCurrentStep: mockSetCurrentStep,
      currentStep: 1,
      steps: [],
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      TOTAL_STEPS: 0,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderStep2K8s = (formDataOverride?: Partial<FormDataType>) => {
    // formDataOverride로 넘어오는 데이터와 mockInitialFormData를 병합할 때 타입을 명확히 지정
    const mergedFormData: FormDataType = {
      ...mockInitialFormData,
      ...formDataOverride,
      k8s: {
        ...mockInitialFormData.k8s,
        ...formDataOverride?.k8s,
        type: (formDataOverride?.k8s?.type || mockInitialFormData.k8s.type) as OrchestrationType, // OrchestrationType으로 강제
      },
    };

    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: mergedFormData,  // 병합된 formData를 사용
      updateFormData: mockUpdateFormData,
      setCurrentStep: mockSetCurrentStep,
      currentStep: 1,
      steps: [],
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      TOTAL_STEPS: 0,
    });

    return render(
      <SurveyProvider>
        <Step2_K8s />
      </SurveyProvider>
    );
  };

  it('renders the orchestration selection and namespace input', () => {
    renderStep2K8s();

    expect(screen.getByLabelText('컨테이너 오케스트레이션')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '컨테이너 오케스트레이션' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '선택' })).toBeInTheDocument(); // '선택' 옵션이 렌더링되는지 확인
    expect(screen.getByRole('option', { name: 'On-premise Kubernetes' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Amazon EKS' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Google GKE' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Azure AKS' })).toBeInTheDocument();

    expect(screen.getByLabelText('Namespace Prefix')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: team-alpha')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Namespace Prefix' })).toBeInTheDocument();
  });

  it('loads initial formData values into the fields', () => {
    const initialK8sConfig = {
      type: 'amazon_eks' as OrchestrationType,
      version: '',
      node: '3',
      namespace: 'my-app-ns'
    };

    renderStep2K8s({ k8s: initialK8sConfig });

    const typeSelect = screen.getByRole('combobox', { name: '컨테이너 오케스트레이션' }) as HTMLSelectElement;
    expect(typeSelect.value).toBe('amazon_eks');

    const namespaceInput = screen.getByRole('textbox', { name: 'Namespace Prefix' }) as HTMLInputElement;
    expect(namespaceInput.value).toBe('my-app-ns');
  });

  it('updates formData when orchestration type is selected', async () => {
    renderStep2K8s();

    const typeSelect = screen.getByRole('combobox', { name: '컨테이너 오케스트레이션' });

    fireEvent.change(typeSelect, { target: { value: 'kubernetes' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalled();
      expect(mockUpdateFormData).toHaveBeenCalledWith('k8s', expect.objectContaining({ type: 'kubernetes' }));
    });
  });

  it('updates formData and performs validation when namespace is typed', async () => {
    renderStep2K8s();

    const namespaceInput = screen.getByRole('textbox', { name: 'Namespace Prefix' });

    fireEvent.change(namespaceInput, { target: { value: 'valid-namespace' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('k8s', expect.objectContaining({ namespace: 'valid-namespace' }));
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });

    fireEvent.change(namespaceInput, { target: { value: '1invalid' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('k8s', expect.objectContaining({ namespace: '1invalid' }));
      expect(screen.getByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).toBeInTheDocument();
    });

    fireEvent.change(namespaceInput, { target: { value: 'another-valid' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('k8s', expect.objectContaining({ namespace: 'another-valid' }));
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });
  });

  it('shows error message when orchestration type is not selected', async () => {
    renderStep2K8s();

    const typeSelect = screen.getByRole('combobox', { name: '컨테이너 오케스트레이션' });

    fireEvent.change(typeSelect, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('오케스트레이션을 선택하세요.')).toBeInTheDocument();
    });
  });

  it('clears orchestration error when a valid type is selected', async () => {
    renderStep2K8s();

    const typeSelect = screen.getByRole('combobox', { name: '컨테이너 오케스트레이션' });

    fireEvent.change(typeSelect, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('오케스트레이션을 선택하세요.')).toBeInTheDocument();
    });

    fireEvent.change(typeSelect, { target: { value: 'kubernetes' } });

    await waitFor(() => {
      expect(screen.queryByText('오케스트레이션을 선택하세요.')).not.toBeInTheDocument();
    });
  });
});
