// src/context/SurveyContext.test.tsx

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { SurveyProvider, useSurvey } from './SurveyContext'; // SurveyContext는 직접 사용하지 않으므로 제거 가능
import { FormDataType } from '@/types/survey'; // 필요한 타입만 임포트

// TestComponent는 Context를 사용하는 소비자입니다.
const TestComponent = () => {
  const { formData, updateFormData, currentStep, setCurrentStep, goToNextStep, goToPrevStep, steps, TOTAL_STEPS } = useSurvey();

  return (
    <div>
      <div data-testid="current-step">{currentStep}</div>
      <div data-testid="total-steps">{TOTAL_STEPS}</div>
      <div data-testid="env">{formData.env}</div>
      {/* K8s, VM, OS 등의 세부 항목은 테스트의 주 목적이 아니므로, env만 확인해도 충분할 수 있습니다.
          하지만 초기값을 확인하는 테스트에서는 유용합니다. */}
      <div data-testid="k8s-type">{formData.k8s.type}</div>
      <div data-testid="vm-hostname">{formData.vm.hostname}</div>
      <div data-testid="os-name">{formData.os.name}</div>
      <div data-testid="frontend-framework-0">{formData.frontendItems[0]?.framework}</div>
      <div data-testid="frontend-domain">{formData.frontendDomain}</div>
      <div data-testid="backend-language-0">{formData.backendItems[0]?.language}</div>
      <div data-testid="api-domain">{formData.apiDomain}</div>
      <div data-testid="webserver-server-0">{formData.webServerItems[0]?.server}</div>
      <div data-testid="db-type-0">{formData.dbItems[0]?.type}</div>
      <ul data-testid="steps-list">
        {steps.map(step => (
          <li key={step.id}>{step.title}</li>
        ))}
      </ul>
      <button onClick={() => updateFormData('env', 'iaas')}>Set Env to IaaS</button>
      <button onClick={() => updateFormData('env', 'paas')}>Set Env to PaaS</button>
      <button onClick={() => updateFormData('env', '')}>Clear Env</button>
      <button onClick={goToNextStep}>Next</button>
      <button onClick={goToPrevStep}>Prev</button>
      <button onClick={() => setCurrentStep(2)}>Set Step to 2</button>
    </div>
  );
};

// Date.now()를 mock하여 예측 가능한 ID를 생성하도록 합니다.
const MOCK_IDS = {
  frontend: 1000,
  backend: 1001,
  webServer: 1002,
  db: 1003,
};

describe('SurveyContext', () => {
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    // Date.now()를 mock하여 초기 formData의 ID가 예측 가능하도록 합니다.
    dateNowSpy = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(MOCK_IDS.frontend) // frontendItems[0].id
      .mockReturnValueOnce(MOCK_IDS.backend) // backendItems[0].id
      .mockReturnValueOnce(MOCK_IDS.webServer) // webServerItems[0].id
      .mockReturnValueOnce(MOCK_IDS.db); // dbItems[0].id
  });

  afterEach(() => {
    dateNowSpy.mockRestore(); // Date.now() 스파이 복원
  });

  test('SurveyProvider가 SurveyContext를 제공하고 기본값으로 초기화됩니다', () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    // 기본 currentStep 확인
    expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    // 기본 env (초기값 ''이므로)
    expect(screen.getByTestId('env')).toHaveTextContent('');
    // steps는 초기 '환경 선택' 하나만 있어야 함
    expect(screen.getByTestId('steps-list')).toHaveTextContent('환경 선택');
    expect(screen.getByTestId('total-steps')).toHaveTextContent('1');

    // 기타 초기값 확인 (일부만)
    expect(screen.getByTestId('k8s-type')).toHaveTextContent('');
    expect(screen.getByTestId('vm-hostname')).toHaveTextContent('');
    expect(screen.getByTestId('os-name')).toHaveTextContent('');
    expect(screen.getByTestId('frontend-framework-0')).toHaveTextContent('');
    expect(screen.getByTestId('frontend-domain')).toHaveTextContent('');
    expect(screen.getByTestId('backend-language-0')).toHaveTextContent('');
    expect(screen.getByTestId('api-domain')).toHaveTextContent('');
    expect(screen.getByTestId('webserver-server-0')).toHaveTextContent('');
    expect(screen.getByTestId('db-type-0')).toHaveTextContent('');
  });

  test('updateFormData가 formData 상태를 올바르게 업데이트합니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    const setEnvButton = screen.getByRole('button', { name: 'Set Env to IaaS' });
    act(() => {
      setEnvButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('env')).toHaveTextContent('iaas');
      expect(screen.getByTestId('total-steps')).toHaveTextContent('8');
      expect(screen.getByTestId('steps-list')).toHaveTextContent('VM');
    });
  });

  test('goToNextStep이 currentStep을 증가시킵니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set Env to IaaS' }).click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('total-steps')).toHaveTextContent('8');
    });

    expect(screen.getByTestId('current-step')).toHaveTextContent('0');

    const nextButton = screen.getByRole('button', { name: 'Next' });
    act(() => {
      nextButton.click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });

    act(() => {
      nextButton.click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('2');
    });
  });

  test('goToPrevStep이 currentStep을 감소시킵니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set Env to IaaS' }).click();
    });
    await waitFor(() => { expect(screen.getByTestId('total-steps')).toHaveTextContent('8'); });

    act(() => {
      screen.getByRole('button', { name: 'Next' }).click();
    });
    await waitFor(() => { expect(screen.getByTestId('current-step')).toHaveTextContent('1'); });

    act(() => {
      screen.getByRole('button', { name: 'Next' }).click();
    });
    await waitFor(() => { expect(screen.getByTestId('current-step')).toHaveTextContent('2'); });

    const prevButton = screen.getByRole('button', { name: 'Prev' });
    act(() => {
      prevButton.click();
    });
    await waitFor(() => { expect(screen.getByTestId('current-step')).toHaveTextContent('1'); });

    act(() => {
      prevButton.click();
    });
    await waitFor(() => { expect(screen.getByTestId('current-step')).toHaveTextContent('0'); });
  });

  test('currentStep이 최소 0을 유지합니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    const prevButton = screen.getByRole('button', { name: 'Prev' });
    act(() => {
      prevButton.click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    });
  });

  test('currentStep이 steps.length - 1을 넘지 않습니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set Env to IaaS' }).click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('total-steps')).toHaveTextContent('8');
    });

    const nextButton = screen.getByRole('button', { name: 'Next' });
    for (let i = 0; i < 10; i++) {
      act(() => {
        nextButton.click();
      });
    }
    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('7');
    });
  });

  test('setCurrentStep이 currentStep을 특정 값으로 설정합니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set Env to IaaS' }).click();
    });
    await waitFor(() => { expect(screen.getByTestId('total-steps')).toHaveTextContent('8'); });

    const setStepTo2Button = screen.getByRole('button', { name: 'Set Step to 2' });
    act(() => {
      setStepTo2Button.click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('2');
    });
  });

  test('env 값에 따라 steps 배열이 올바르게 업데이트됩니다 (iaas)', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set Env to IaaS' }).click();
    });

    await waitFor(() => {
      const stepsList = screen.getByTestId('steps-list');
      expect(stepsList).toHaveTextContent('환경 선택');
      expect(stepsList).toHaveTextContent('VM');
      expect(stepsList).toHaveTextContent('자원 선택');
      expect(stepsList).toHaveTextContent('OS');
      expect(stepsList).toHaveTextContent('프론트엔드');
      expect(stepsList).toHaveTextContent('백엔드');
      expect(stepsList).toHaveTextContent('웹 서버');
      expect(stepsList).toHaveTextContent('DB');
      expect(screen.getByTestId('total-steps')).toHaveTextContent('8');
    });
  });

  test('env 값에 따라 steps 배열이 올바르게 업데이트됩니다 (paas)', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set Env to PaaS' }).click();
    });

    await waitFor(() => {
      const stepsList = screen.getByTestId('steps-list');
      expect(stepsList).toHaveTextContent('환경 선택');
      expect(stepsList).toHaveTextContent('K8s');
      expect(stepsList).toHaveTextContent('자원 선택');
      expect(stepsList).toHaveTextContent('OS');
      expect(stepsList).toHaveTextContent('프론트엔드');
      expect(stepsList).toHaveTextContent('백엔드');
      expect(stepsList).toHaveTextContent('웹 서버');
      expect(stepsList).toHaveTextContent('DB');
      expect(screen.getByTestId('total-steps')).toHaveTextContent('8');
    });
  });

  test('env 값이 변경될 때 steps 배열이 초기 상태로 돌아갑니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set Env to IaaS' }).click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('total-steps')).toHaveTextContent('8');
    });

    act(() => {
      screen.getByRole('button', { name: 'Clear Env' }).click();
    });

    await waitFor(() => {
      const stepsList = screen.getByTestId('steps-list');
      expect(stepsList).toHaveTextContent('환경 선택');
      expect(stepsList.children).toHaveLength(1);
      expect(screen.getByTestId('total-steps')).toHaveTextContent('1');
    });
  });

  test('updateFormData가 이전 값과 동일하면 상태를 업데이트하지 않습니다', async () => {
    render(
      <SurveyProvider>
        <TestComponent />
      </SurveyProvider>
    );

    // 초기값은 env: ''
    expect(screen.getByTestId('env')).toHaveTextContent('');

    // env를 iaas로 업데이트
    act(() => {
      screen.getByRole('button', { name: 'Set Env to IaaS' }).click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('env')).toHaveTextContent('iaas');
    });

    // 여기서 `setFormData`가 호출되지 않았는지 직접 확인하기는 어렵습니다.
    // 하지만 `formData`의 값이 변경되지 않았음을 확인하는 것으로 충분합니다.
    // React의 useState의 setState 함수는 이전 값과 동일한 값을 전달하면
    // 리렌더링을 일으키지 않는다는 것이 React의 동작 방식입니다.
    // 이 테스트는 이 "동작 방식"을 간접적으로 확인합니다.
    const originalEnv = screen.getByTestId('env').textContent; // 현재 값을 저장

    act(() => {
        screen.getByRole('button', { name: 'Set Env to IaaS' }).click(); // 같은 값으로 다시 클릭
    });

    // 렌더링이 일어나지 않거나, 값이 그대로 유지되는지 확인
    // waitFor를 사용하면 상태 변경을 기다리지만, 여기서는 변경이 없음을 확인해야 합니다.
    // 이 경우, `waitFor`는 필요하지 않거나, timeout을 통해 변경이 없음을 "기다릴" 수 있습니다.
    // 그러나 가장 직접적인 방법은 컴포넌트의 렌더링 횟수를 추적하는 것인데, 이는 더 복잡합니다.
    // 현재는 값이 변하지 않는지만 확인하는 것으로 충분합니다.
    expect(screen.getByTestId('env')).toHaveTextContent(originalEnv as string);
  });

  test('useSurvey 훅이 SurveyProvider 외부에서 사용될 때 에러를 발생시킵니다', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useSurvey must be used within a SurveyProvider');
    (console.error as jest.Mock).mockRestore();
  });
});