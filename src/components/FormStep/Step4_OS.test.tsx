// src/components/FormStep/Step4_OS.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step4_OS from '@/components/FormStep/Step4_OS';
import { FormDataType, OSName } from '@/types/survey'; // 필요한 타입 임포트

// SurveyContext를 모킹합니다.
// 실제 애플리케이션의 컨텍스트를 사용하지 않고 테스트용 데이터를 주입합니다.
const mockUpdateFormData = jest.fn();

const mockInitialFormData: FormDataType = {
  // Step4_OS 테스트에 필요한 최소한의 formData만 제공합니다.
  os: { name: '', version: '' }, 
  // 다른 필드들은 이 테스트에서는 중요하지 않으므로, 필요한 경우 빈 객체 등으로 채웁니다.
  env: 'paas', 
  k8s: { type: 'kubernetes', version: '', node: '', namespace: '' },
  vm: { environment: 'on-premise', ec2Type: '', ebsType: '', ebsSize: '', hostname: '', username: '' },
  resources: { cpu: '', ram: '', disk: '' },
  frontendItems: [],
  frontendDomain: '',
  backendItems: [],
  apiDomain: '',
  apiPaths: [''],
  webServerItems: [],
  dbItems: [],
};

// 테스트 스위트를 정의합니다.
describe('Step4_OS', () => {
  // 각 테스트 실행 전에 SurveyContext를 초기화합니다.
  beforeEach(() => {
    mockUpdateFormData.mockClear(); // 각 테스트마다 목 함수 호출 기록 초기화
    // SurveyContext의 useSurvey 훅을 모킹합니다.
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: mockInitialFormData,
      updateFormData: mockUpdateFormData,
      // 이 테스트에서는 사용되지 않는 나머지 값들도 필요하다면 제공합니다.
      currentStep: 4, 
      setCurrentStep: jest.fn(),
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      TOTAL_STEPS: 5,
    });
  });

  // 헬퍼 함수: 컴포넌트를 렌더링합니다.
  const renderStep4OS = () => {
    return render(<Step4_OS />);
  };

  // ✅ 첫 번째 테스트: 컴포넌트가 올바르게 렌더링되는지 확인
  it('renders correctly with OS selection options', () => {
    renderStep4OS();

    // "운영 체제 선택" 제목이 있는지 확인
    expect(screen.getByText('운영 체제 선택')).toBeInTheDocument();

    // OS 이미지 버튼들이 렌더링되는지 확인
    expect(screen.getByRole('button', { name: /Ubuntu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RHEL/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SUSE/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Debian/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Amazon Linux/i })).toBeInTheDocument();

    // 초기에는 버전 선택 드롭다운이 보이지 않는지 확인
    expect(screen.queryByLabelText(/버전 선택/i)).not.toBeInTheDocument();
  });

  // ✅ 두 번째 테스트: OS를 선택했을 때 버전 드롭다운이 나타나고 localOS가 업데이트되는지 확인
  it('displays version select when an OS is selected and updates formData', async () => {
    renderStep4OS();

    // Ubuntu 버튼 클릭
    const ubuntuButton = screen.getByRole('button', { name: /Ubuntu/i });
    fireEvent.click(ubuntuButton);

    // 버전 선택 드롭다운이 나타나는지 확인
    const versionSelect = await screen.findByLabelText(/버전 선택/i);
    expect(versionSelect).toBeInTheDocument();

    // localOS (따라서 formData)가 Ubuntu로 업데이트되었는지 확인
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('os', { name: 'ubuntu', version: '' });
    });

    // 버전 선택 후 localOS (따라서 formData)가 업데이트되는지 확인
    fireEvent.change(versionSelect, { target: { value: '22.04.5 (LTS / Jammy Jellyfish)' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('os', { name: 'ubuntu', version: '22.04.5 (LTS / Jammy Jellyfish)' });
    });
  });

  // ✅ 세 번째 테스트: 선택된 OS를 다시 클릭하면 선택이 해제되는지 확인
  it('deselects OS when clicking on an already selected OS', async () => {
    renderStep4OS();

    const ubuntuButton = screen.getByRole('button', { name: /Ubuntu/i });
    
    // Ubuntu 선택
    fireEvent.click(ubuntuButton);
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('os', { name: 'ubuntu', version: '' });
    });
    
    // 버전 선택 드롭다운이 나타났는지 확인
    const versionSelect = screen.getByLabelText(/버전 선택/i);
    expect(versionSelect).toBeInTheDocument();

    mockUpdateFormData.mockClear(); // mock 호출 기록을 초기화하여 다음 클릭만 추적

    // Ubuntu 다시 클릭 (선택 해제 시도)
    fireEvent.click(ubuntuButton);

    // OS와 버전이 초기화되었는지 확인
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('os', { name: '', version: '' });
    });

    // 버전 선택 드롭다운이 사라졌는지 확인
    expect(screen.queryByLabelText(/버전 선택/i)).not.toBeInTheDocument();
  });

  // ✅ 네 번째 테스트: 다른 OS로 변경할 때 버전이 초기화되는지 확인
  it('resets version when selecting a different OS', async () => {
    renderStep4OS();

    // Ubuntu 선택
    fireEvent.click(screen.getByRole('button', { name: /Ubuntu/i }));
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('os', { name: 'ubuntu', version: '' });
    });

    // Ubuntu 버전 선택
    fireEvent.change(screen.getByLabelText(/버전 선택/i), { target: { value: '20.04.6 (LTS / Focal Fossa)' } });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('os', { name: 'ubuntu', version: '20.04.6 (LTS / Focal Fossa)' });
    });

    mockUpdateFormData.mockClear(); // mock 호출 기록을 초기화

    // RHEL 선택 (다른 OS)
    fireEvent.click(screen.getByRole('button', { name: /RHEL/i }));

    // localOS가 RHEL로 바뀌면서 버전이 초기화되었는지 확인
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('os', { name: 'rhel', version: '' });
    });

    // RHEL의 버전 드롭다운이 나타나고 현재 값이 비어있는지 확인
    const rhelVersionSelect = screen.getByLabelText(/버전 선택/i);
    expect(rhelVersionSelect).toBeInTheDocument();
    expect(rhelVersionSelect).toHaveValue('');
  });
});