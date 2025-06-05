// components/FormStep/Step2_VM.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step2_VM from '@/components/FormStep/Step2_VM'; // 실제 경로에 맞게 수정
import { SurveyProvider } from '@/context/SurveyContext'; // SurveyProvider 임포트
import { FormDataType } from '@/types/survey'; // FormDataType 임포트

// useSurvey 훅의 Mock 구현을 위한 spyOn
const mockUpdateFormData = jest.fn();
const mockSetCurrentStep = jest.fn(); // Step2_VM에서는 사용하지 않지만, useSurvey의 반환값에 포함되므로 목킹합니다.

// SurveyContext의 초기 formData와 유사한 mock 데이터 정의
const mockInitialFormData: FormDataType = {
  env: 'iaas', // VM 스텝은 일반적으로 IaaS 환경에서 렌더링되므로 기본값 설정
  vm: { hostname: '', username: '', environment: 'on-premise', ec2Type: '', ebsType: '' },
  k8s: { type: '', version: '', node: '', namespace: '' },
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

describe('Step2_VM', () => {
  // 각 테스트 실행 전 mock 함수 초기화 및 useSurvey 훅 목킹
  beforeEach(() => {
    mockUpdateFormData.mockClear();
    mockSetCurrentStep.mockClear();

    // 모든 테스트를 위해 useSurvey 훅을 기본값으로 목킹
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: mockInitialFormData,
      updateFormData: mockUpdateFormData,
      setCurrentStep: mockSetCurrentStep,
      currentStep: 1, // Step2는 보통 1단계 (0부터 시작)
      steps: [],
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      TOTAL_STEPS: 0,
    });
  });

  // 각 테스트 후 모든 목킹을 복원
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 헬퍼 함수: Step2_VM 컴포넌트를 SurveyProvider로 감싸서 렌더링
  const renderStep2VM = (formDataOverride?: Partial<FormDataType>) => {
    // formData를 오버라이드할 수 있도록 useSurvey 목킹 값을 업데이트
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: { ...mockInitialFormData, ...formDataOverride },
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
        <Step2_VM />
      </SurveyProvider>
    );
  };

  it('renders hostname and username input fields', () => {
    renderStep2VM();

    // 호스트네임 입력 필드 확인
    expect(screen.getByLabelText('호스트네임')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: my-vm-host')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '호스트네임' })).toBeInTheDocument();

    // 사용자 이름 입력 필드 확인
    expect(screen.getByLabelText('사용자 이름')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: ubuntu')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '사용자 이름' })).toBeInTheDocument();
  });

  it('loads initial formData values into the fields', () => {
    const initialVMConfig = {
      hostname: 'initial-host',
      username: 'initial-user',
      environment: 'on-premise' as 'on-premise' | 'aws',
      ec2Type: 't2.micro', // 현재 컴포넌트에서는 사용되지 않지만 타입에 맞춤
      ebsType: 'gp2', // 현재 컴포넌트에서는 사용되지 않지만 타입에 맞춤
    };

    renderStep2VM({ vm: initialVMConfig });

    // 호스트네임 입력 필드 초기값 확인
    const hostnameInput = screen.getByRole('textbox', { name: '호스트네임' }) as HTMLInputElement;
    expect(hostnameInput.value).toBe('initial-host');

    // 사용자 이름 입력 필드 초기값 확인
    const usernameInput = screen.getByRole('textbox', { name: '사용자 이름' }) as HTMLInputElement;
    expect(usernameInput.value).toBe('initial-user');
  });

  it('updates formData and performs validation for hostname', async () => {
    renderStep2VM();

    const hostnameInput = screen.getByRole('textbox', { name: '호스트네임' });

    // 유효한 호스트네임 입력
    fireEvent.change(hostnameInput, { target: { value: 'valid-hostname-123' } });
    await waitFor(() => {
      // updateFormData는 localVM 변경 시 호출되므로, expect.objectContaining으로 부분 일치 확인
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ hostname: 'valid-hostname-123' }));
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });

    // 유효하지 않은 호스트네임 입력 (숫자로 시작)
    fireEvent.change(hostnameInput, { target: { value: '1invalid-host' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ hostname: '1invalid-host' }));
      expect(screen.getByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).toBeInTheDocument();
    });

    // 다시 유효한 호스트네임 입력
    fireEvent.change(hostnameInput, { target: { value: 'another-valid-host' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ hostname: 'another-valid-host' }));
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });

    // 빈 값 입력
    fireEvent.change(hostnameInput, { target: { value: '' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ hostname: '' }));
      // 현재 컴포넌트 로직상 빈 값은 유효성 검사 오류를 발생시키지 않습니다.
      // `value === '' || /^[a-zA-Z][-a-zA-Z0-9]*$/.test(value)` 로직 때문에 `value === ''`일 때 `isValid`가 `true`가 됩니다.
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });
  });

  it('updates formData and performs validation for username', async () => {
    renderStep2VM();

    const usernameInput = screen.getByRole('textbox', { name: '사용자 이름' });

    // 유효한 사용자 이름 입력
    fireEvent.change(usernameInput, { target: { value: 'my-user' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ username: 'my-user' }));
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });

    // 유효하지 않은 사용자 이름 입력 (특수문자 포함)
    fireEvent.change(usernameInput, { target: { value: 'user@name' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ username: 'user@name' }));
      expect(screen.getByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).toBeInTheDocument();
    });

    // 다시 유효한 사용자 이름 입력
    fireEvent.change(usernameInput, { target: { value: 'another-user' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ username: 'another-user' }));
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });

    // 빈 값 입력
    fireEvent.change(usernameInput, { target: { value: '' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({ username: '' }));
      // 현재 컴포넌트 로직상 빈 값은 유효성 검사 오류를 발생시키지 않습니다.
      expect(screen.queryByText('영문자로 시작하고, 영문자/숫자/하이픈만 사용할 수 있습니다.')).not.toBeInTheDocument();
    });
  });
});