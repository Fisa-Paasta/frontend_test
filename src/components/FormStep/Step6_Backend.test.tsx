import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SurveyProvider, useSurvey } from '@/context/SurveyContext'; // 경로 확인 필요
import { FormDataType, BackendItem, FrontendItem, WebServerItem, DBItem } from '@/types/survey';
import Step6_Backend from './Step6_Backend';

// mockUpdateFormData 함수는 useSurvey 훅을 모킹할 때 사용됩니다.
let mockUpdateFormData: jest.Mock;

// renderStep6Backend 함수는 테스트 시나리오에 따라 SurveyProvider를 렌더링합니다.
const renderStep6Backend = (initialFormDataOverrides: Partial<FormDataType> = {}) => {
  // 이 함수는 실제 컴포넌트를 렌더링하고,
  // beforeEach에서 설정된 mockCurrentFormDataState와 mockUpdateFormData를 사용하게 됩니다.
  return render(
    <SurveyProvider>
      <Step6_Backend />
    </SurveyProvider>
  );
};


describe('Step6_Backend', () => {
  // ✅ currentMockFormDataState 변수 이름을 mockCurrentFormDataState로 변경
  let mockCurrentFormDataState: FormDataType;

  // jest.mock 호출은 describe 블록의 가장 상단에 위치해야 합니다.
  // Jest의 모킹 메커니즘 때문에, 모듈 팩토리는 'beforeEach' 블록 내의 변수에 접근할 수 없습니다.
  // 이 모킹 로직은 파일 스코프에서 평가되므로, mock 변수를 사용해야 합니다.
  jest.mock('@/context/SurveyContext', () => ({
    // 실제 모듈의 다른 모든 export를 가져옴
    ...jest.requireActual('@/context/SurveyContext'),
    useSurvey: () => ({
      // ✅ 모킹된 useSurvey 훅이 mockCurrentFormDataState를 반환하도록 합니다.
      formData: mockCurrentFormDataState, // 이제 'mockCurrentFormDataState' 참조 가능
      updateFormData: mockUpdateFormData,
      currentStep: 5,
      setCurrentStep: jest.fn(),
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      steps: [
        { id: 0, title: '환경 선택' },
        { id: 1, title: 'VM' },
        { id: 2, title: '자원 선택' },
        { id: 3, title: 'OS' },
        { id: 4, title: '프론트엔드' },
        { id: 5, title: '백엔드' },
        { id: 6, title: '웹 서버' },
        { id: 7, title: 'DB' }
      ],
      TOTAL_STEPS: 8,
    }),
  }));


  beforeEach(() => {
    jest.clearAllMocks(); // 모든 mock 호출 내역 초기화
    // Date.now()를 mock하여 예측 가능한 ID를 생성합니다.
    // backendItems의 초기 id는 101, 새로 추가되는 id는 102 (Date.now() + 1 이므로)
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(100) // frontendItems[0].id
      .mockReturnValueOnce(101) // backendItems[0].id (Date.now() + 1)
      .mockReturnValueOnce(102) // webServerItems[0].id (Date.now() + 2)
      .mockReturnValueOnce(103) // dbItems[0].id (Date.now() + 3)
      .mockReturnValue(200); // 이후 호출에 대해서는 고정값 (예: 새 백엔드 항목 추가 시)

    mockUpdateFormData = jest.fn((key: keyof FormDataType, value: FormDataType[keyof FormDataType]) => {
      // mockUpdateFormData가 호출될 때 mockCurrentFormDataState를 업데이트합니다.
      mockCurrentFormDataState = { ...mockCurrentFormDataState, [key]: value };
    });

    // 각 테스트 시작 시 mockCurrentFormDataState를 기본값으로 초기화합니다.
    // 여기서 initialFormDataOverrides를 적용하여 초기 상태를 설정합니다.
    mockCurrentFormDataState = {
        env: '',
        vm: { hostname: '', username: '', environment: 'on-premise', ec2Type: '', ebsType: '' },
        k8s: { type: '', version: '', node: '', namespace: '' },
        resources: { cpu: '', ram: '', disk: '' },
        os: { name: '', version: '' },
        frontendItems: [{ id: 100, framework: '', version: '' }],
        frontendDomain: '',
        backendItems: [{ id: 101, language: '', languageVersion: '', framework: '', frameworkVersion: '' }],
        apiDomain: '',
        apiPaths: [''],
        webServerItems: [{ id: 102, server: '', version: '' }],
        dbItems: [{ id: 103, type: '', name: '', version: '', size: '' }],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks(); // 모든 mock을 복원
  });

  // 1. 초기 렌더링 테스트
  it('renders correctly with default values', () => {
    // 테스트 시작 전에 mockCurrentFormDataState를 초기값으로 설정
    // env 필드를 기본값으로 설정하고 시작합니다.
    // renderStep6Backend() 호출 전에 mockCurrentFormDataState의 초기 상태를 설정해야 합니다.
    mockCurrentFormDataState = {
        ...mockCurrentFormDataState, // 기본값들 유지
        env: '', // 명시적으로 기본값 설정
    };

    renderStep6Backend();

    // 초기에는 하나의 백엔드 항목이 있어야 합니다.
    expect(screen.getByText('백엔드 언어 선택 1')).toBeInTheDocument();
    // 언어 선택 카드들이 보여야 합니다.
    expect(screen.getByRole('button', { name: 'Java 선택하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Node.js 선택하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Python 선택하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go 선택하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ruby 선택하기' })).toBeInTheDocument();

    // API 도메인 및 경로 섹션은 paas 환경일 때만 표시되어야 합니다.
    expect(screen.queryByLabelText('API 도메인')).not.toBeInTheDocument();
    expect(screen.queryByText('API Prefix Path')).not.toBeInTheDocument();
  });

  // 2. PAAS 환경일 때 API 도메인 및 경로 섹션 렌더링 테스트
  it.only('renders API domain and paths section when env is paas', () => {
    // envType을 'paas'로 설정하여 API 도메인 및 경로 섹션이 렌더링되도록 합니다.
    // ✅ 이것이 올바른 호출 방식입니다.
    renderStep6Backend({ env: 'paas' }); // envType이 아니라 env 필드입니다.

    // 'API 도메인' 입력 필드, 'API Prefix Path' 필드셋, '+ 경로 추가' 버튼이 있는지 확인
    expect(screen.getByLabelText('API 도메인')).toBeInTheDocument();
    expect(screen.getByText('API Prefix Path')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('/api')).toBeInTheDocument();
    // ✅ 이전에 확인했던 '새 API 경로 추가' aria-label을 사용합니다.
    expect(screen.getByRole('button', { name: '새 API 경로 추가' })).toBeInTheDocument();
  });


  // 3. 새 백엔드 항목 추가 테스트
  it('adds a new backend item when "+ 백엔드 추가" button is clicked', async () => {
    renderStep6Backend(); // 컴포넌트 렌더링

    const addButton = screen.getByRole('button', { name: '새 백엔드 항목 추가' });
    fireEvent.click(addButton);

    // mockUpdateFormData의 마지막 호출을 확인합니다.
    await waitFor(() => {
      expect(mockUpdateFormData).lastCalledWith('backendItems', expect.arrayContaining([
        // 기존 초기 항목 (ID는 101로 고정되었으므로)
        expect.objectContaining({ id: 101, language: '', languageVersion: '', framework: '', frameworkVersion: '' }),
        // 새로 추가된 항목 (ID는 Date.now() + 1로 생성되므로 201)
        expect.objectContaining({ id: 201, language: '', languageVersion: '', framework: '', frameworkVersion: '' }),
      ]));
    });
  });

  // 4. 백엔드 항목 삭제 테스트
  it.only('removes a backend item when trash icon is clicked', async () => {
      const initialItems: BackendItem[] = [
          { id: 1, language: 'java', languageVersion: 'JDK 17 (LTS)', framework: 'spring_boot', frameworkVersion: '3.1' },
          { id: 2, language: 'python', languageVersion: '3.10', framework: 'django', frameworkVersion: '3.2' },
      ];
      // 테스트 시작 전에 mockCurrentFormDataState를 설정합니다.
      act(() => {
        mockUpdateFormData('backendItems', initialItems);
      });

      renderStep6Backend(); // 오버라이드된 backendItems로 시작

      // 첫 번째 항목의 삭제 버튼 클릭
      const removeButton1 = screen.getByLabelText('백엔드 항목 1 삭제');
      fireEvent.click(removeButton1);

      await waitFor(() => {
          // 제거된 항목 (id=1)과 관련된 요소들이 DOM에 없는지 확인
          expect(screen.queryByLabelText('Java 버전 선택')).not.toBeInTheDocument();
          expect(screen.queryByLabelText('Spring Boot 버전 선택')).not.toBeInTheDocument();

          // '백엔드 언어 선택 2' 텍스트는 이제 '백엔드 언어 선택 1'이 되었으므로,
          // '백엔드 언어 선택 2'라는 텍스트 자체는 사라져야 함
          expect(screen.queryByText('백엔드 언어 선택 2')).not.toBeInTheDocument();

          // 두 번째 항목이 이제 '백엔드 언어 선택 1'로 보여지는지 확인
          expect(screen.getByText('백엔드 언어 선택 1')).toBeInTheDocument();
          // 남은 항목(id=2)과 관련된 요소들이 여전히 DOM에 있는지 확인
          expect(screen.getByLabelText('Python 버전 선택')).toBeInTheDocument();

          // mockUpdateFormData의 마지막 호출을 확인: id=1 항목이 제거된 배열
          expect(mockUpdateFormData).lastCalledWith('backendItems', [
              expect.objectContaining({ id: 2, language: 'python', framework: 'django' }),
          ]);
      });
  });

  // 5. 언어 선택 및 해제 테스트
  it('selects and deselects a backend language', async () => {
    renderStep6Backend();

    const javaButton = screen.getByRole('button', { name: 'Java 선택하기' });
    fireEvent.click(javaButton);

    await waitFor(() => {
      expect(javaButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Java 버전 선택')).toBeInTheDocument();
      expect(screen.getByText('Java 프레임워크 선택')).toBeInTheDocument();
    });

    // mockUpdateFormData 호출 확인
    expect(mockUpdateFormData).toHaveBeenCalledWith('backendItems', expect.arrayContaining([
      expect.objectContaining({ id: 101, language: 'java', languageVersion: '', framework: '', frameworkVersion: '' }), // ID 명시
    ]));

    // 다시 클릭하여 선택 해제
    fireEvent.click(javaButton);

    await waitFor(() => {
      expect(javaButton).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByLabelText('Java 버전 선택')).not.toBeInTheDocument();
      expect(screen.queryByText('Java 프레임워크 선택')).not.toBeInTheDocument();
    });

    // mockUpdateFormData 호출 확인 (초기 빈 값으로 돌아와야 함)
    expect(mockUpdateFormData).toHaveBeenCalledWith('backendItems', expect.arrayContaining([
      expect.objectContaining({ id: 101, language: '', languageVersion: '', framework: '', frameworkVersion: '' }), // ID 명시
    ]));
  });

  // 6. 프레임워크 선택 및 해제 테스트 (Java 선택 후 Spring Boot 선택으로 예시)
  it('selects and deselects a backend framework', async () => {
      renderStep6Backend();

      // 먼저 Java 언어 선택
      const javaButton = screen.getByRole('button', { name: 'Java 선택하기' });
      fireEvent.click(javaButton);

      // 'Java 프레임워크 선택' 텍스트를 정규식으로 찾도록 수정 (이전 답변에서 이미 적용됨)
      await waitFor(() => expect(screen.getByText(/Java 프레임워크 선택/i)).toBeInTheDocument());

      const springBootButton = screen.getByRole('button', { name: 'Spring Boot 선택하기' });
      fireEvent.click(springBootButton);

      await waitFor(() => {
        expect(springBootButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('combobox', { name: /spring_boot 버전 선택/i })).toBeInTheDocument();
      });

      // mockUpdateFormData 호출 확인
      expect(mockUpdateFormData).toHaveBeenCalledWith('backendItems', expect.arrayContaining([
        expect.objectContaining({ id: 101, language: 'java', framework: 'spring_boot' }), // ID 명시
      ]));

      // 다시 클릭하여 선택 해제
      fireEvent.click(springBootButton);

      await waitFor(() => {
        expect(springBootButton).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByRole('combobox', { name: /spring_boot 버전 선택/i })).not.toBeInTheDocument();
      });

      // mockUpdateFormData 호출 확인 (프레임워크가 빈 값으로 돌아와야 함)
      expect(mockUpdateFormData).toHaveBeenCalledWith('backendItems', expect.arrayContaining([
        expect.objectContaining({ id: 101, language: 'java', framework: '' }), // ID 명시
      ]));
  });

  // 7. 언어/프레임워크 버전 선택 테스트
  it('updates language and framework versions', async () => {
      renderStep6Backend();

      // Java 언어 선택
      fireEvent.click(screen.getByRole('button', { name: 'Java 선택하기' }));
      await waitFor(() => expect(screen.getByLabelText(/java 버전 선택/i)).toBeInTheDocument());

      const langVersionSelect = screen.getByLabelText(/java 버전 선택/i);
      fireEvent.change(langVersionSelect, { target: { value: 'JDK 17 (LTS)' } });
      await waitFor(() => expect(langVersionSelect).toHaveValue('JDK 17 (LTS)'));

      // Spring Boot 프레임워크 선택
      fireEvent.click(screen.getByRole('button', { name: 'Spring Boot 선택하기' }));

      await waitFor(() => expect(screen.getByRole('combobox', { name: /spring_boot 버전 선택/i })).toBeInTheDocument());

      const fwVersionSelect = screen.getByRole('combobox', { name: /spring_boot 버전 선택/i });
      fireEvent.change(fwVersionSelect, { target: { value: '3.0' } });
      await waitFor(() => expect(fwVersionSelect).toHaveValue('3.0'));

      // mockUpdateFormData 호출 확인
      expect(mockUpdateFormData).toHaveBeenCalledWith('backendItems', expect.arrayContaining([
        expect.objectContaining({
          id: 101, // ID 명시
          language: 'java',
          languageVersion: 'JDK 17 (LTS)',
          framework: 'spring_boot',
          frameworkVersion: '3.0'
        }),
      ]));
  });

  // 8. API 도메인 입력 테스트
  it('updates API domain and shows error for invalid format', async () => {
    // 테스트 시작 전에 env를 'paas'로 설정
    act(() => {
        mockUpdateFormData('env', 'paas');
    });
    renderStep6Backend();

    const domainInput = screen.getByLabelText('API 도메인');
    fireEvent.change(domainInput, { target: { value: 'invalid-domain' } });

    const errorMessage = await screen.findByText('도메인 형식이 올바르지 않습니다.');
    expect(errorMessage).toBeInTheDocument();
    expect(domainInput).toHaveClass('border-red-500');

    // 유효한 도메인 입력
    fireEvent.change(domainInput, { target: { value: 'api.example.com' } });
    await waitFor(() => {
      expect(screen.queryByText('도메인 형식이 올바르지 않습니다.')).not.toBeInTheDocument();
      expect(domainInput).not.toHaveClass('border-red-500');
    });

    expect(mockUpdateFormData).toHaveBeenCalledWith('apiDomain', 'api.example.com');
  });

  // 9. API Path 추가 및 제거 테스트
  it('adds and removes API paths', async () => {
    // 테스트 시작 전에 env를 'paas'로 설정
    act(() => {
        mockUpdateFormData('env', 'paas');
    });
    renderStep6Backend();

    const addPathButton = screen.getByRole('button', { name: '+ 경로 추가' });
    // 초기 apiPaths는 `['']`이므로 첫 번째 input은 API 경로 1이 됩니다.
    const initialPathInput = screen.getByLabelText('API 경로 1');

    // 새 경로 추가
    fireEvent.click(addPathButton);
    await waitFor(() => {
      expect(screen.getByLabelText('API 경로 2')).toBeInTheDocument();
    });

    // 경로 입력 변경
    fireEvent.change(initialPathInput, { target: { value: '/v1' } });
    const newPathInput = screen.getByLabelText('API 경로 2');
    fireEvent.change(newPathInput, { target: { value: '/admin' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('apiPaths', ['/v1', '/admin']);
    });

    // 경로 제거 (두 번째 경로 제거)
    const removePathButton2 = screen.getByLabelText('API 경로 2 삭제');
    fireEvent.click(removePathButton2);

    await waitFor(() => {
      expect(screen.queryByLabelText('API 경로 2')).not.toBeInTheDocument();
      expect(screen.getByLabelText('API 경로 1')).toHaveValue('/v1'); // 첫 번째 경로는 그대로
    });

    expect(mockUpdateFormData).toHaveBeenCalledWith('apiPaths', ['/v1']);

    // 마지막 남은 경로도 제거 (빈 배열이 아닌 빈 문자열로 초기화되는지 확인)
    const removePathButton1 = screen.getByLabelText('API 경로 1 삭제');
    fireEvent.click(removePathButton1);

    await waitFor(() => {
        expect(screen.getByLabelText('API 경로 1')).toHaveValue('');
        expect(mockUpdateFormData).toHaveBeenCalledWith('apiPaths', ['']);
    });
  });

  // 10. 초기 `backendItems`가 빈 배열일 때 단일 항목이 생성되는지 확인 (현재 초기화 로직에 따라)
  it('initializes with one backend item if formData.backendItems is empty or not provided', async () => {
    // 테스트 시작 전에 mockCurrentFormDataState를 비어있는 backendItems로 설정
    act(() => {
        mockUpdateFormData('backendItems', []);
    });
    renderStep6Backend();

    // 컴포넌트가 하나의 백엔드 항목을 렌더링하는지 확인
    // NOTE: SurveyProvider의 initialFormData 로직에 따라 Date.now() + 1로 새 ID가 생성됨
    // beforeEach에서 Date.now()를 모킹했으므로 첫 번째 backendItems는 101이 됩니다.
    await waitFor(() => {
      expect(screen.getByText('백엔드 언어 선택 1')).toBeInTheDocument();
      // 두 번째 항목은 없어야 함
      expect(screen.queryByText('백엔드 언어 선택 2')).not.toBeInTheDocument();
    });

    // mockUpdateFormData가 호출되어 하나의 기본 백엔드 항목으로 초기화되었는지 확인
    expect(mockUpdateFormData).toHaveBeenCalledWith('backendItems', expect.arrayContaining([
      expect.objectContaining({ id: 101, language: '', languageVersion: '', framework: '', frameworkVersion: '' }),
    ]));
  });
});