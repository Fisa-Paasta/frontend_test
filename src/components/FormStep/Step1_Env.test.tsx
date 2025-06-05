// components/FormStep/Step1_Env.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Step1_Env from '@/components/FormStep/Step1_Env'; // 실제 경로에 맞게 수정
import { SurveyProvider, useSurvey } from '@/context/SurveyContext'; // SurveyProvider와 useSurvey 임포트
import { FormDataType, EnvType } from '@/types/survey'; // 필요한 타입 임포트

// useSurvey 훅의 Mock 구현 (테스트 환경에서 SurveyContext의 동작을 제어하기 위함)
// jest.mock을 사용하여 useSurvey를 전체적으로 목킹할 수도 있지만,
// 여기서는 SurveyProvider 내부에서 mock된 Context 값을 제공하는 방식을 사용합니다.
// 이 방식이 실제 컨텍스트 시스템과 더 가깝게 상호작용하는 테스트를 가능하게 합니다.

describe('Step1_Env', () => {
  // SurveyContext에서 제공될 값들을 위한 mock 함수 및 상태
  const mockUpdateFormData = jest.fn();
  const mockSetCurrentStep = jest.fn();
  const initialMockFormData: FormDataType = {
    env: '',
    k8s: { type: '', version: '', node: '', namespace: '' },
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

  // 각 테스트 실행 전에 mock 함수 초기화
  beforeEach(() => {
    mockUpdateFormData.mockClear();
    mockSetCurrentStep.mockClear();
  });

  // Step1_Env 컴포넌트를 SurveyProvider로 감싸서 렌더링하는 헬퍼 함수
  const renderStep1Env = (initialFormData = initialMockFormData) => {
    // SurveyProvider의 value를 Mocking하여 테스트에 필요한 함수들을 주입합니다.
    return render(
      <SurveyProvider>
        {/*
          실제 SurveyProvider가 아닌, 테스트용으로 목킹된 SurveyContext 값을 주입하는
          더 세밀한 제어가 필요한 경우, 아래와 같이 SurveyContext.Provider를 직접 사용할 수 있습니다.
          하지만 여기서는 SurveyProvider가 자체적으로 initialFormData를 관리하므로,
          SurveyProvider의 상태를 직접 제어하는 대신, useSurvey의 반환값을 목킹하는 것이 더 일반적입니다.

          현재 SurveyProvider는 initialFormData를 내부적으로 관리하므로,
          initialFormData를 바꾸려면 SurveyProvider 내에서 formData를 조작해야 합니다.
          아니면, useSurvey 훅 자체를 목킹하여 formData 값을 제어할 수 있습니다.
          이 예시에서는 useSurvey 훅을 목킹하여 formData와 mock 함수들을 제어하는 방식으로 진행합니다.
        */}
        <Step1_Env />
      </SurveyProvider>
    );
  };

  // useSurvey 훅을 목킹하여 테스트에 필요한 값을 주입
  // 이 방법은 컴포넌트가 컨텍스트 값을 소비하는 방식을 테스트할 때 유용합니다.
  beforeEach(() => {
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: initialMockFormData, // 테스트 시작 시 초기 formData 제공
      updateFormData: mockUpdateFormData,
      setCurrentStep: mockSetCurrentStep,
      currentStep: 0, // 필요한 경우 이 값도 목킹
      steps: [], // 필요한 경우 이 값도 목킹
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      TOTAL_STEPS: 0,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks(); // 각 테스트 후 목킹을 복원하여 다른 테스트에 영향 주지 않도록 함
  });


  it('renders the environment selection dropdown', () => {
    renderStep1Env();

    // "환경 선택" 레이블이 있는지 확인
    expect(screen.getByLabelText('환경 선택')).toBeInTheDocument();

    // 드롭다운 (select) 요소가 있는지 확인
    const selectElement = screen.getByRole('combobox', { name: '환경 선택' });
    expect(selectElement).toBeInTheDocument();

    // 옵션들이 올바르게 렌더링되는지 확인
    expect(screen.getByRole('option', { name: '선택' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'IaaS' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PaaS' })).toBeInTheDocument();
  });

  it('displays the initial selected environment from formData', () => {
    // formData.env가 'iaas'로 초기화된 경우를 테스트
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: { ...initialMockFormData, env: 'iaas' },
      updateFormData: mockUpdateFormData,
      setCurrentStep: mockSetCurrentStep,
      currentStep: 0,
      steps: [],
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      TOTAL_STEPS: 0,
    });

    renderStep1Env();

    const selectElement = screen.getByRole('combobox', { name: '환경 선택' }) as HTMLSelectElement;
    expect(selectElement.value).toBe('iaas'); // 'iaas'가 선택되어 있는지 확인
  });

  it('calls updateFormData and setCurrentStep when an environment is selected', () => {
    renderStep1Env();

    const selectElement = screen.getByRole('combobox', { name: '환경 선택' });

    // 'paas' 옵션 선택 시뮬레이션
    fireEvent.change(selectElement, { target: { value: 'paas' } });

    // updateFormData가 'env'와 'paas' 값으로 호출되었는지 확인
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormData).toHaveBeenCalledWith('env', 'paas');

    // setCurrentStep이 0으로 호출되었는지 확인
    expect(mockSetCurrentStep).toHaveBeenCalledTimes(1);
    expect(mockSetCurrentStep).toHaveBeenCalledWith(0);
  });

  it('handles "선택" option correctly', () => {
    renderStep1Env();

    const selectElement = screen.getByRole('combobox', { name: '환경 선택' });

    // "선택" 옵션 선택 시뮬레이션
    fireEvent.change(selectElement, { target: { value: '' } });

    // updateFormData가 'env'와 빈 문자열 값으로 호출되었는지 확인
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormData).toHaveBeenCalledWith('env', '');

    // setCurrentStep이 0으로 호출되었는지 확인
    expect(mockSetCurrentStep).toHaveBeenCalledTimes(1);
    expect(mockSetCurrentStep).toHaveBeenCalledWith(0);
  });
});