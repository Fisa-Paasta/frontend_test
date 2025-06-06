import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import * as SurveyContextModule from '@/context/SurveyContext';
import {
  FormDataType,
  WebServerItem,
  EnvType,
  SurveyContextType,
  WebServerType,
  DBItem,
  DBType,
  BackendItem,
  BackendLanguage,
  BackendFramework,
  FrontendItem
} from '@/types/survey';

import Step7_WebServer from './Step7_WebServer';

let mockDateNow: jest.SpyInstance;
let spyOnUseSurvey: jest.SpyInstance;

const MOCK_BASE_ID = 1000;
let dateNowCounter = MOCK_BASE_ID; // Date.now() 모킹을 위한 카운터

// useSurvey 훅 모킹 헬퍼 함수
const setupSurveyContextMock = (initialData: FormDataType) => {
  let currentFormData = initialData;
  const mockUpdateFormData = jest.fn((key: keyof FormDataType, value: FormDataType[keyof FormDataType]) => {
    currentFormData = { ...currentFormData, [key]: value };
    // updateFormData가 호출될 때마다 useSurvey의 반환값을 업데이트하여
    // 컴포넌트가 최신 formData를 참조할 수 있도록 합니다.
    spyOnUseSurvey.mockReturnValue({
      formData: currentFormData,
      updateFormData: mockUpdateFormData,
      currentStep: 6,
      setCurrentStep: jest.fn(),
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      steps: [
        { id: 0, title: '환경 선택' }, { id: 1, title: 'VM' }, { id: 2, title: '자원 선택' },
        { id: 3, title: 'OS' }, { id: 4, title: '프론트엔드' }, { id: 5, title: '백엔드' },
        { id: 6, title: '웹 서버' }, { id: 7, title: 'DB' }
      ],
      TOTAL_STEPS: 8,
    } as SurveyContextType);
  });

  // 초기 useSurvey mock 설정
  spyOnUseSurvey = jest.spyOn(SurveyContextModule, 'useSurvey').mockReturnValue({
    formData: initialData, // 초기 렌더링 시에는 초기 데이터 사용
    updateFormData: mockUpdateFormData,
    currentStep: 6,
    setCurrentStep: jest.fn(),
    goToNextStep: jest.fn(),
    goToPrevStep: jest.fn(),
    steps: [
      { id: 0, title: '환경 선택' }, { id: 1, title: 'VM' }, { id: 2, title: '자원 선택' },
      { id: 3, title: 'OS' }, { id: 4, title: '프론트엔드' }, { id: 5, title: '백엔드' },
      { id: 6, title: '웹 서버' }, { id: 7, title: 'DB' }
    ],
    TOTAL_STEPS: 8,
  } as SurveyContextType);

  return { mockUpdateFormData, spyOnUseSurvey };
};


describe('Step7_WebServer', () => {

  const baseFormDataTemplate: FormDataType = {
    env: 'on-premise' as EnvType,
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

  beforeEach(() => {
    jest.clearAllMocks(); // 모든 mock 초기화
    dateNowCounter = MOCK_BASE_ID; // 각 테스트 시작 시 카운터 초기화
    mockDateNow = jest.spyOn(Date, 'now').mockImplementation(() => {
      return dateNowCounter++; // 호출될 때마다 1씩 증가
    });
  });

  afterEach(() => {
    mockDateNow.mockRestore(); // Date.now() 모킹 복원
    // spyOnUseSurvey는 setupSurveyContextMock 내부에서 매번 새로 정의되므로, 여기서는 별도로 restore하지 않아도 됩니다.
    // jest.clearAllMocks()가 충분히 역할을 합니다.
  });


  // 1. 초기 렌더링 테스트: formData.webServerItems가 비어있을 때
  it('renders correctly with one default web server item when formData is empty', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      webServerItems: [], // 초기 formData는 비어있음
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);

    render(<Step7_WebServer />);

    await waitFor(() => {
      expect(screen.getByText('웹서버 선택 1')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Nginx 선택하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apache HTTP Server 선택하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tomcat 선택하기' })).toBeInTheDocument();

    expect(screen.queryByLabelText(/버전 선택/i)).not.toBeInTheDocument();

    // formData가 비어있었으므로, 컴포넌트 내부에서 기본 항목이 추가되고,
    // 이로 인해 updateFormData가 한번 호출되었을 것으로 기대합니다.
    // (useState의 초기값이 formData와 다를 때 useEffect가 호출됨)
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'webServerItems',
      [{ id: MOCK_BASE_ID, server: '', version: '' }] // MOCK_BASE_ID가 1000이므로 1000이 될 것임
    );
  });

  // 2. 초기 렌더링 테스트: formData.webServerItems에 값이 있을 때
  it('renders correctly with pre-filled web server items from formData', async () => {
    const preFilledWebServerItems: WebServerItem[] = [
      { id: 500, server: 'nginx' as WebServerType, version: '1.28.0 (LTS)' },
      { id: 501, server: 'apache' as WebServerType, version: '' },
    ];
    const initialFormData = {
      ...baseFormDataTemplate,
      webServerItems: preFilledWebServerItems,
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);

    render(<Step7_WebServer />);

    await waitFor(() => {
      expect(screen.getByText('웹서버 선택 1')).toBeInTheDocument();
      expect(screen.getByText('웹서버 선택 2')).toBeInTheDocument();
    });

    const nginxButton = screen.getByRole('button', { name: 'Nginx 선택됨 (클릭하여 해제)' });
    expect(nginxButton).toBeInTheDocument();
    expect(nginxButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('nginx 버전 선택')).toHaveValue('1.28.0 (LTS)');

    const apacheButton = screen.getByRole('button', { name: 'Apache HTTP Server 선택됨 (클릭하여 해제)' });
    expect(apacheButton).toBeInTheDocument();
    expect(apacheButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('apache 버전 선택')).toHaveValue('');

    // formData에 이미 채워진 값이 있고, useState 초기화도 동일하므로
    // useEffect의 비교 조건에 의해 updateFormData는 호출되지 않습니다.
    expect(mockUpdateFormData).not.toHaveBeenCalled();
  });


  // 3. 웹서버 선택/해제 테스트
  it('selects and deselects a web server', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      webServerItems: [{ id: MOCK_BASE_ID, server: '' as WebServerType, version: '' }] as WebServerItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step7_WebServer />);

    // 초기 렌더링 시에는 formData와 useState 초기값이 동일하므로 updateFormData 호출 안됨
    expect(mockUpdateFormData).not.toHaveBeenCalled();

    const nginxButton = screen.getByRole('button', { name: 'Nginx 선택하기' });
    
    // Nginx 선택
    await act(async () => {
      fireEvent.click(nginxButton);
    });

    await waitFor(() => {
      expect(nginxButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('nginx 버전 선택')).toBeInTheDocument();
    });
    // Nginx 선택으로 webServerItems가 변경되었으므로 updateFormData 호출 (1회차)
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'webServerItems',
      [{ id: MOCK_BASE_ID, server: 'nginx', version: '' }]
    );

    // mockUpdateFormData 호출 기록 초기화 (이전 호출은 이미 검증했으므로)
    mockUpdateFormData.mockClear();

    // Nginx 선택 해제
    await act(async () => {
      fireEvent.click(nginxButton);
    });

    await waitFor(() => {
      expect(nginxButton).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByLabelText('nginx 버전 선택')).not.toBeInTheDocument();
    });
    // Nginx 해제로 webServerItems가 다시 변경되었으므로 updateFormData 호출 (2회차)
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1); // 1회차 호출 이후 Clear했으므로 다시 1
    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'webServerItems',
      [{ id: MOCK_BASE_ID, server: '', version: '' }]
    );
  });

  // 4. 웹서버 버전 변경 테스트
  it('updates the web server version', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      webServerItems: [{ id: MOCK_BASE_ID, server: 'nginx' as WebServerType, version: '' }] as WebServerItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step7_WebServer />);

    // 초기 렌더링 시 updateFormData는 호출되지 않음 (initialFormData와 useState 초기값이 동일)
    expect(mockUpdateFormData).not.toHaveBeenCalled();

    const versionSelect = screen.getByLabelText('nginx 버전 선택');
    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '1.28.0 (LTS)' } });
    });

    await waitFor(() => {
      expect(versionSelect).toHaveValue('1.28.0 (LTS)');
    });
    // 버전 변경으로 webServerItems가 변경되었으므로 updateFormData 호출 (1회차)
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'webServerItems',
      [{ id: MOCK_BASE_ID, server: 'nginx', version: '1.28.0 (LTS)' }]
    );
  });

  // 5. 웹서버 항목 추가 테스트
  it('adds a new web server item when "+ 웹서버 추가" button is clicked', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      // 초기에는 하나의 기본 항목만 있도록 설정합니다 (이전 테스트에서 1번 통과 시나리오와 유사)
      webServerItems: [], // <- 여기를 빈 배열로 설정하면 초기 렌더링 시 1번 호출됨
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step7_WebServer />);

    // 초기 렌더링 시 updateFormData는 1번 호출됨 (formData.webServerItems가 비어있고 useState로 default item 추가)
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormData).toHaveBeenCalledWith(
        'webServerItems',
        [{ id: MOCK_BASE_ID, server: '', version: '' }]
    );
    mockUpdateFormData.mockClear(); // 첫 호출 검증 후 초기화

    expect(screen.getByText('웹서버 선택 1')).toBeInTheDocument();
    expect(screen.queryByText('웹서버 선택 2')).not.toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: '새 웹서버 항목 추가' });

    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('웹서버 선택 2')).toBeInTheDocument();
    });
    expect(screen.getByText('웹서버 선택 1')).toBeInTheDocument();

    // '+ 웹서버 추가' 버튼 클릭으로 새 항목이 추가되고 updateFormData 호출 (1회차)
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1); // mockClear 후 다시 1회
    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'webServerItems',
      expect.arrayContaining([
        expect.objectContaining({ id: MOCK_BASE_ID, server: '', version: '' }), // 기존 항목
        expect.objectContaining({ id: MOCK_BASE_ID + 1, server: '', version: '' }), // 새로 추가된 항목 (dateNowCounter가 1000에서 시작하여 1001이 될 것)
      ])
    );
  });

// 6. 웹서버 항목 삭제 테스트
  it('removes a web server item when trash icon is clicked', async () => {
    const initialWebServerItems: WebServerItem[] = [
      { id: 100, server: 'nginx' as WebServerType, version: '1.28.0 (LTS)' },
      { id: 200, server: 'apache' as WebServerType, version: '2.4.63 (Latest)' },
    ];
    const initialFormData = {
      ...baseFormDataTemplate,
      webServerItems: initialWebServerItems,
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step7_WebServer />);

    // 초기 렌더링 시 updateFormData는 호출되지 않음
    expect(mockUpdateFormData).not.toHaveBeenCalled();

    // 웹서버 항목 1 (id: 100)과 웹서버 항목 2 (id: 200)가 존재하는지 확인
    expect(screen.getByTestId('webserver-item-100')).toBeInTheDocument();
    expect(screen.getByTestId('webserver-item-200')).toBeInTheDocument();
    
    const removeButton1 = screen.getByLabelText('웹서버 항목 1 삭제');

    await act(async () => {
      fireEvent.click(removeButton1);
    });

    await waitFor(() => {
      // id: 100을 가진 웹서버 항목 div가 사라졌는지 확인
      expect(screen.queryByTestId('webserver-item-100')).not.toBeInTheDocument();
    });

    // id: 200을 가진 웹서버 항목 div는 여전히 존재하는지 확인
    // 이 시점에는 webServerItems 배열에 남은 항목이 하나뿐이므로,
    // 그 항목이 "웹서버 선택 1"로 다시 렌더링될 것입니다.
    expect(screen.getByText('웹서버 선택 1')).toBeInTheDocument(); 
    expect(screen.getByRole('button', { name: 'Apache HTTP Server 선택됨 (클릭하여 해제)' })).toBeInTheDocument();


    // 삭제로 인해 webServerItems가 변경되었으므로 updateFormData 호출 (1회차)
    expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'webServerItems',
      [{ id: 200, server: 'apache', version: '2.4.63 (Latest)' }]
    );
  });

  // 7. 마지막 항목은 삭제할 수 없는지 테스트
  it('does not remove the last web server item', async () => {
    const initialWebServerItems: WebServerItem[] = [
      { id: 100, server: 'nginx' as WebServerType, version: '1.28.0 (LTS)' },
    ];
    const initialFormData = {
      ...baseFormDataTemplate,
      webServerItems: initialWebServerItems,
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step7_WebServer />);

    // 초기 렌더링 시 updateFormData는 호출되지 않음
    expect(mockUpdateFormData).not.toHaveBeenCalled();

    expect(screen.getByText('웹서버 선택 1')).toBeInTheDocument();
    // 마지막 항목일 경우 삭제 버튼이 렌더링되지 않음을 기대
    expect(screen.queryByLabelText('웹서버 항목 1 삭제')).not.toBeInTheDocument(); 

    // 삭제 버튼이 없으므로 클릭 시도할 필요 없음.
    // 만약 삭제 버튼이 존재한다면 이 테스트는 실패해야 함.
    // 이전 코드에서 getByLabelText로 요소를 찾으려 했기 때문에 null 오류가 발생했습니다.
    // 이제는 queryByLabelText로 null을 반환하는 것이 맞고, not.toBeInTheDocument()로 검증합니다.
    
    // 마지막 항목이므로 삭제 로직이 실행되지 않아 updateFormData 호출도 없음.
    expect(mockUpdateFormData).not.toHaveBeenCalled();
  });
});