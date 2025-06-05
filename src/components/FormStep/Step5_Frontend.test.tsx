import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step5_Frontend from '@/components/FormStep/Step5_Frontend';
import { FormDataType, FrontendItem, EnvType } from '@/types/survey'; // EnvType 임포트 확인

// SurveyContext 훅을 모킹합니다.
const mockUpdateFormData = jest.fn();

// 기본 mockFormData 정의
// EnvType 제약 조건을 준수합니다.
const baseMockFormData: FormDataType = {
  env: 'paas', // 기본값은 'paas'로 설정하여 도메인 입력 필드가 기본적으로 보이도록 합니다.
  frontendItems: [],
  frontendDomain: '',
  k8s: { type: '', version: '', node: '', namespace: '' },
  vm: { environment: 'on-premise', ec2Type: '', ebsType: '', ebsSize: '', hostname: '', username: '' }, // vm.environment도 EnvType에 맞게 초기화될 수 있도록 비워둡니다.
  resources: { cpu: '', ram: '', disk: '' },
  os: { name: '', version: '' },
  backendItems: [],
  apiDomain: '',
  apiPaths: [''],
  webServerItems: [],
  dbItems: [],
};

// 헬퍼 함수: 컴포넌트를 렌더링하고 필요한 formData를 주입합니다.
// 헬퍼 함수: 컴포넌트를 렌더링하고 필요한 formData를 주입합니다.
const renderStep5Frontend = (initialData: Partial<FormDataType> = {}) => {
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockImplementation(() => {
      // 중요한 변경: initialData에 맞춰 상태를 한 번 초기화합니다.
      // 이 상태가 React.useState에 의해 관리되는 실제 mock formData입니다.
      const [mockFormDataState, setMockFormDataState] = React.useState<FormDataType>(() => ({
        ...baseMockFormData,
        ...initialData
      }));
  
      const mockContextUpdateFormData = (key: keyof FormDataType, value: any) => {
        // 1. mockUpdateFormData 호출 (Jest Mock)
        // 이 호출은 나중에 expect(mockUpdateFormData).toHaveBeenCalledWith(...) 로 확인할 것입니다.
        mockUpdateFormData(key, value); 
  
        // 2. setMockFormDataState 호출 (React 상태 업데이트)
        // 이 부분이 컴포넌트의 리렌더링을 유발합니다.
        setMockFormDataState(prevState => {
          // 이전 상태와 새로운 값이 같으면 불필요한 업데이트를 방지합니다.
          // 이것이 무한 루프를 막는 핵심입니다.
          if (prevState[key] === value) {
              return prevState;
          }
          const newState = { ...prevState, [key]: value };
          return newState;
        });
      };
  
      return {
        formData: mockFormDataState,
        updateFormData: mockContextUpdateFormData,
        currentStep: 5,
        setCurrentStep: jest.fn(),
        goToNextStep: jest.fn(),
        goToPrevStep: jest.fn(),
        TOTAL_STEPS: 0,
      };
    });
    return render(<Step5_Frontend />);
  };

// 테스트 스위트를 정의합니다.
describe('Step5_Frontend', () => {
  beforeEach(() => {
    mockUpdateFormData.mockClear();
  });

  // --- 초기 렌더링 테스트 ---
  it('renders correctly with initial empty state', () => {
    renderStep5Frontend({ frontendItems: [] }); 

    expect(screen.queryByText('프론트엔드 프레임워크 선택 1')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 프론트엔드 항목 추가' })).toBeInTheDocument();
    expect(screen.getByLabelText('프론트 도메인 (필수 항목 X)')).toHaveValue('');
  });

  it('renders correctly with initial frontend item and domain', () => {
    renderStep5Frontend({
      frontendItems: [{ id: 1, framework: 'react', version: '18.3.1' }],
      frontendDomain: 'test.com',
    });

    expect(screen.getByText('프론트엔드 프레임워크 선택 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'React 선택됨 (클릭하여 해제)' })).toBeInTheDocument();
    expect(screen.getByLabelText(/React 버전 선택/i)).toHaveValue('18.3.1'); 
    expect(screen.getByLabelText('프론트 도메인 (필수 항목 X)')).toHaveValue('test.com');
  });

  // --- 프레임워크 추가/삭제 테스트 ---
  it('adds a new frontend item when "새 프론트엔드 항목 추가" button is clicked', async () => {
    renderStep5Frontend({ frontendItems: [] });

    const addButton = screen.getByRole('button', { name: '새 프론트엔드 항목 추가' });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('프론트엔드 프레임워크 선택 1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('frontendItems', expect.arrayContaining([{ id: expect.any(Number), framework: '', version: '' }]));
    });

    fireEvent.click(addButton);
    await waitFor(() => {
      expect(screen.getByText('프론트엔드 프레임워크 선택 2')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('frontendItems', expect.arrayContaining([
        expect.objectContaining({ framework: '', version: '' }),
        expect.objectContaining({ framework: '', version: '' })
      ]));
    });
  });

  it('removes a frontend item when trash icon is clicked', async () => {
    const initialFrontendItems = [
      { id: Date.now(), framework: 'react', version: '18.3.1' },
      { id: Date.now() + 1, framework: 'vue', version: '' },
    ];
    renderStep5Frontend({ frontendItems: initialFrontendItems });

    // 초기 상태 확인 (프론트엔드 항목 컨테이너의 존재 확인)
    const frontendItem1Legend = screen.getByText('프론트엔드 프레임워크 선택 1');
    const frontendItem2Legend = screen.getByText('프론트엔드 프레임워크 선택 2');
    expect(frontendItem1Legend).toBeInTheDocument();
    expect(frontendItem2Legend).toBeInTheDocument();

    const removeButton1 = screen.getByLabelText('프론트엔드 항목 1 삭제');
    fireEvent.click(removeButton1);

    await waitFor(() => {
        // 첫 번째 프론트엔드 항목의 '프론트엔드 프레임워크 선택 1' legend가 사라져야 함
        expect(frontendItem1Legend).not.toBeInTheDocument(); // 이제 Vue 항목이 1번째가 되므로 원래 1번째 요소의 legend는 사라져야 함

        // Vue 항목 (원래 2번째 항목)이 이제 '프론트엔드 프레임워크 선택 1'으로 재정렬되었는지 확인
        // 주의: queryByText로 먼저 찾고, 없으면 getByText로 찾아서 확인
        const vueItemLegendAfterRemoval = screen.getByText('프론트엔드 프레임워크 선택 1');
        expect(vueItemLegendAfterRemoval).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Vue.js 선택됨 (클릭하여 해제)' })).toBeInTheDocument(); // Vue는 선택된 상태로 남아있음

        // React와 관련된 특정 버전 선택 드롭다운은 사라져야 함 (해당 항목이 사라졌으므로)
        expect(screen.queryByLabelText(/React 버전 선택/i)).not.toBeInTheDocument();

        // mockUpdateFormData가 올바르게 호출되었는지 확인
        expect(mockUpdateFormData).toHaveBeenCalledWith('frontendItems', [
            expect.objectContaining({ id: initialFrontendItems[1].id, framework: 'vue', version: '' }),
        ]);
        // 첫 번째 항목은 더 이상 formData에 없어야 함
        expect(mockUpdateFormData).not.toHaveBeenCalledWith('frontendItems', expect.arrayContaining([
            expect.objectContaining({ id: initialFrontendItems[0].id, framework: 'react', version: '18.3.1' })
        ]));
    });
  }, 15000); // 타임아웃은 필요에 따라 조절

  // --- 프레임워크 선택/해제 및 버전 변경 테스트 ---
  it('selects a framework and resets its version', async () => {
    renderStep5Frontend({ frontendItems: [{ id: 1, framework: '', version: '' }] });

    const reactButton = screen.getByRole('button', { name: 'React 선택하기' });
    fireEvent.click(reactButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'React 선택됨 (클릭하여 해제)' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('frontendItems', expect.arrayContaining([
        expect.objectContaining({ framework: 'react', version: '' })
      ]));
    });

    const versionSelect = screen.getByLabelText(/React 버전 선택/i);
    expect(versionSelect).toBeInTheDocument();
    expect(versionSelect).toHaveValue('');
  });

  it('deselects a framework when clicking on an already selected one', async () => {
    renderStep5Frontend({ frontendItems: [{ id: 1, framework: 'react', version: '18.3.1' }] });

    const reactButton = screen.getByRole('button', { name: 'React 선택됨 (클릭하여 해제)'});
    fireEvent.click(reactButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'React 선택하기' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'React 선택됨 (클릭하여 해제)' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('frontendItems', expect.arrayContaining([
        expect.objectContaining({ framework: '', version: '' })
      ]));
    });
    expect(screen.queryByLabelText(/React 버전 선택/i)).not.toBeInTheDocument();
  });

  it('updates the version when a version is selected', async () => {
    renderStep5Frontend({ frontendItems: [{ id: 1, framework: 'react', version: '' }] });

    const versionSelect = screen.getByLabelText(/React 버전 선택/i);
    fireEvent.change(versionSelect, { target: { value: '18.3.1' } });

    await waitFor(() => {
      expect(versionSelect).toHaveValue('18.3.1');
    });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('frontendItems', expect.arrayContaining([
        expect.objectContaining({ framework: 'react', version: '18.3.1' })
      ]));
    });
  });

  // --- 도메인 입력 테스트 ---
  it('updates frontend domain input', async () => {
    renderStep5Frontend({ env: 'paas' });

    const domainInput = screen.getByLabelText('프론트 도메인 (필수 항목 X)');
    fireEvent.change(domainInput, { target: { value: 'myfrontend.com' } });

    await waitFor(() => {
      expect(domainInput).toHaveValue('myfrontend.com');
    });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('frontendDomain', 'myfrontend.com');
    });
  });

  it('shows error for invalid domain format', async () => {
    renderStep5Frontend({ env: 'paas' }); // env가 'paas'일 때 도메인 인풋이 나타나는지 확인

    const domainInput = screen.getByLabelText('프론트 도메인 (필수 항목 X)');
    fireEvent.change(domainInput, { target: { value: 'invalid-domain' } });

    // await waitFor 대신 await screen.findByText를 사용하여 에러 메시지가 나타나기를 기다립니다.
    const errorMessage = await screen.findByText('도메인 형식이 올바르지 않습니다.');
    expect(errorMessage).toBeInTheDocument();
    expect(domainInput).toHaveClass('border-red-500');

    // formData가 컨텍스트로 업데이트되었는지 확인하는 부분 (useEffect에 의해 비동기적으로 발생)
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('frontendDomain', 'invalid-domain');
    });
  });
  it('does not show error for empty domain', async () => {
    renderStep5Frontend({ env: 'paas', frontendDomain: 'invalid' });

    const domainInput = screen.getByLabelText('프론트 도메인 (필수 항목 X)');
    await waitFor(() => {
      expect(screen.getByText('도메인 형식이 올바르지 않습니다.')).toBeInTheDocument();
    });

    fireEvent.change(domainInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.queryByText('도메인 형식이 올바르지 않습니다.')).not.toBeInTheDocument();
      expect(domainInput).not.toHaveClass('border-red-500');
    });
  });

  it('clears domain error when valid format is entered', async () => {
    renderStep5Frontend({ env: 'paas' });

    const domainInput = screen.getByLabelText('프론트 도메인 (필수 항목 X)');
    fireEvent.change(domainInput, { target: { value: 'invalid' } });

    await waitFor(() => {
      expect(screen.getByText('도메인 형식이 올바르지 않습니다.')).toBeInTheDocument();
    });

    fireEvent.change(domainInput, { target: { value: 'valid.com' } });

    await waitFor(() => {
      expect(screen.queryByText('도메인 형식이 올바르지 않습니다.')).not.toBeInTheDocument();
      expect(domainInput).not.toHaveClass('border-red-500');
    });
  });

  it('does not show domain input if environment is not paas', () => {
    // EnvType에 'on-premise'가 없으므로 'iaas' 사용
    renderStep5Frontend({ env: 'iaas' }); 

    expect(screen.queryByLabelText('프론트 도메인 (필수 항목 X)')).not.toBeInTheDocument();
  });
});