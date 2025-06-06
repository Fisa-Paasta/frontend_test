import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import * as SurveyContextModule from '@/context/SurveyContext';
import {
  FormDataType,
  BackendItem,
  EnvType,
  SurveyContextType,
  BackendLanguage,
  BackendFramework,
  WebServerItem,
  DBItem, // DBItem 타입을 명시적으로 가져옵니다.
  DBType // DBType 타입도 필요합니다.
} from '@/types/survey';

import Step6_Backend from './Step6_Backend';

let mockDateNow: jest.SpyInstance;
let spyOnUseSurvey: jest.SpyInstance;

const MOCK_BASE_ID = 1000;

const setupSurveyContextMock = (initialData: FormDataType) => {
  let currentFormData = initialData;
  const mockUpdateFormData = jest.fn((key: keyof FormDataType, value: FormDataType[keyof FormDataType]) => {
    currentFormData = { ...currentFormData, [key]: value };
    spyOnUseSurvey.mockReturnValue({
      formData: currentFormData,
      updateFormData: mockUpdateFormData,
      currentStep: 5,
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

  spyOnUseSurvey = jest.spyOn(SurveyContextModule, 'useSurvey').mockReturnValue({
    formData: currentFormData,
    updateFormData: mockUpdateFormData,
    currentStep: 5,
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


describe('Step6_Backend', () => {

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
    dbItems: [], // 초기화 시 빈 배열로 두거나, 아래 initialFormData에서 정확히 타입 지정
  };

  beforeEach(() => {
    jest.clearAllMocks();
    let dateNowCalls = 0;
    mockDateNow = jest.spyOn(Date, 'now').mockImplementation(() => {
      dateNowCalls++;
      if (dateNowCalls === 1) return MOCK_BASE_ID;
      if (dateNowCalls === 2) return MOCK_BASE_ID + 1;
      if (dateNowCalls === 3) return MOCK_BASE_ID + 2;
      if (dateNowCalls === 4) return MOCK_BASE_ID + 3;
      return MOCK_BASE_ID + dateNowCalls - 1;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockDateNow.mockRestore();
    spyOnUseSurvey.mockRestore();
  });


  it('renders correctly with default values', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      frontendItems: [{ id: MOCK_BASE_ID, framework: '', version: '' }],
      backendItems: [{
        id: MOCK_BASE_ID + 1,
        language: '' as BackendLanguage, languageVersion: '',
        framework: '' as BackendFramework, frameworkVersion: ''
      }],
      webServerItems: [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem],
      // ✨ 여기 수정 ✨
      dbItems: [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    await waitFor(() => {
      expect(screen.getByText('백엔드 언어 선택 1')).toBeInTheDocument();
    });
    // ... 나머지 assertions
  });

  it('renders API domain and paths section when env is paas', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      env: 'paas' as EnvType,
      frontendItems: [{ id: MOCK_BASE_ID, framework: '', version: '' }],
      backendItems: [{
        id: MOCK_BASE_ID + 1, language: '' as BackendLanguage, languageVersion: '',
        framework: '' as BackendFramework, frameworkVersion: ''
      }],
      webServerItems: [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem],
      // ✨ 여기 수정 ✨
      dbItems: [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('adds a new backend item when "+ 백엔드 추가" button is clicked', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      backendItems: [{
        id: MOCK_BASE_ID + 1,
        language: '' as BackendLanguage, languageVersion: '',
        framework: '' as BackendFramework, frameworkVersion: ''
      }],
      frontendItems: [{ id: MOCK_BASE_ID, framework: '', version: '' }],
      webServerItems: [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem],
      // ✨ 여기 수정 ✨
      dbItems: [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('removes a backend item when trash icon is clicked', async () => {
    const initialItems: BackendItem[] = [
      { id: 100, language: 'java', languageVersion: 'JDK 17 (LTS)', framework: 'spring_boot', frameworkVersion: '3.1' },
      { id: 200, language: 'python', languageVersion: '3.10', framework: 'django', frameworkVersion: '3.2' },
    ];
    const initialFormData = { ...baseFormDataTemplate, backendItems: initialItems };
    initialFormData.frontendItems = [{ id: MOCK_BASE_ID, framework: '', version: '' }];
    initialFormData.webServerItems = [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem];
    // ✨ 여기 수정 ✨
    initialFormData.dbItems = [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[];
    // 또는 실제 DBItem을 만드세요
    // initialFormData.dbItems = [{ id: 1, type: 'mysql' as DBType, name: 'mydb', version: '8.0', size: 'small' }];

    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('selects and deselects a backend language', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      backendItems: [{
        id: MOCK_BASE_ID + 1,
        language: '' as BackendLanguage, languageVersion: '',
        framework: '' as BackendFramework, frameworkVersion: ''
      }],
      frontendItems: [{ id: MOCK_BASE_ID, framework: '', version: '' }],
      webServerItems: [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem],
      // ✨ 여기 수정 ✨
      dbItems: [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('selects and deselects a backend framework', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      backendItems: [{
        id: MOCK_BASE_ID + 1,
        language: 'java' as BackendLanguage, languageVersion: 'JDK 17 (LTS)',
        framework: '' as BackendFramework, frameworkVersion: ''
      }],
      frontendItems: [{ id: MOCK_BASE_ID, framework: '', version: '' }],
      webServerItems: [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem],
      // ✨ 여기 수정 ✨
      dbItems: [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('updates language and framework versions', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      backendItems: [{
        id: MOCK_BASE_ID + 1,
        language: 'java' as BackendLanguage, languageVersion: '',
        framework: 'spring_boot' as BackendFramework, frameworkVersion: ''
      }],
      frontendItems: [{ id: MOCK_BASE_ID, framework: '', version: '' }],
      webServerItems: [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem],
      // ✨ 여기 수정 ✨
      dbItems: [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[],
    };
    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('updates API domain and shows error for invalid format', async () => {
    const initialFormData = { ...baseFormDataTemplate, env: 'paas' as EnvType };
    initialFormData.backendItems = [{
      id: MOCK_BASE_ID + 1, language: '' as BackendLanguage, languageVersion: '',
      framework: '' as BackendFramework, frameworkVersion: ''
    }];
    initialFormData.frontendItems = [{ id: MOCK_BASE_ID, framework: '', version: '' }];
    initialFormData.webServerItems = [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem];
    // ✨ 여기 수정 ✨
    initialFormData.dbItems = [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[];

    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('adds and removes API paths', async () => {
    const initialFormData = {
      ...baseFormDataTemplate,
      env: 'paas' as EnvType,
      apiPaths: ['/initial-path']
    };
    initialFormData.backendItems = [{
      id: MOCK_BASE_ID + 1, language: '' as BackendLanguage, languageVersion: '',
      framework: '' as BackendFramework, frameworkVersion: ''
    }];
    initialFormData.frontendItems = [{ id: MOCK_BASE_ID, framework: '', version: '' }];
    initialFormData.webServerItems = [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem];
    // ✨ 여기 수정 ✨
    initialFormData.dbItems = [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[];

    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });

  it('initializes with one backend item if formData.backendItems is empty or not provided', async () => {
    const initialFormData = { ...baseFormDataTemplate, backendItems: [] };
    initialFormData.frontendItems = [{ id: MOCK_BASE_ID, framework: '', version: '' }];
    initialFormData.webServerItems = [{ id: MOCK_BASE_ID + 2, server: '', version: '' } as WebServerItem];
    // ✨ 여기 수정 ✨
    initialFormData.dbItems = [{ id: MOCK_BASE_ID + 3, type: '' as DBType, name: '', version: '', size: '' }] as DBItem[];

    const { mockUpdateFormData } = setupSurveyContextMock(initialFormData);
    render(<Step6_Backend />);
    // ... 나머지 assertions
  });
});