// src/components/FormStep/Step8_DB.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step8_DB from './Step8_DB';
import { useSurvey } from '@/context/SurveyContext';

// SurveyContext를 mock합니다.
jest.mock('@/context/SurveyContext', () => ({
  useSurvey: jest.fn(),
}));

const mockUpdateFormData = jest.fn();

// Date.now()를 위한 mock 시간 설정
const MOCK_INITIAL_ID_TIME = 1000;
const MOCK_NEW_ITEM_ID_TIME = 1001; // 새 항목이 추가될 때의 ID

describe('Step8_DB', () => {
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockUpdateFormData.mockClear();

    // Date.now()를 mock하여 예측 가능한 ID를 생성하도록 합니다.
    // 각 테스트의 시작 시 Date.now() 스파이를 다시 설정합니다.
    dateNowSpy = jest.spyOn(Date, 'now');

    // useSurvey hook의 반환 값을 mock합니다.
    (useSurvey as jest.Mock).mockReturnValue({
      formData: { dbItems: [] }, // 기본적으로 빈 dbItems로 시작 (컴포넌트가 하나를 추가)
      updateFormData: mockUpdateFormData,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    dateNowSpy.mockRestore(); // 스파이 복원
  });

  test('컴포넌트가 올바르게 렌더링되고 초기 DB 항목을 표시합니다', async () => {
    // 이 테스트에서는 초기 렌더링 시 Date.now()가 한 번만 호출되도록 합니다.
    dateNowSpy.mockReturnValue(MOCK_INITIAL_ID_TIME);

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${MOCK_INITIAL_ID_TIME}`)).toBeInTheDocument();
      expect(screen.getByText('데이터베이스 항목 1')).toBeInTheDocument();
      expect(screen.getByText('데이터베이스 타입 선택 1')).toBeInTheDocument();
    });
  });

  test('폼 데이터에서 미리 채워진 DB 항목으로 올바르게 렌더링됩니다', async () => {
    const preFilledData = [
      { id: 100, type: 'relational', name: 'mysql', version: '8.0.36 (LTS)', size: '10' },
      { id: 101, type: 'nosql', name: 'mongodb', version: '7.0', size: '20' },
    ];

    // 미리 채워진 데이터의 ID를 순서대로 반환하도록 Date.now()를 mock합니다.
    dateNowSpy
      .mockReturnValueOnce(100) // 첫 번째 미리 채워진 항목의 ID
      .mockReturnValueOnce(101); // 두 번째 미리 채워진 항목의 ID

    (useSurvey as jest.Mock).mockReturnValue({
      formData: { dbItems: preFilledData },
      updateFormData: mockUpdateFormData,
    });

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-100`)).toBeInTheDocument();
      expect(screen.getByTestId(`db-item-101`)).toBeInTheDocument();
      expect(screen.getByText('데이터베이스 항목 1')).toBeInTheDocument();
      expect(screen.getByText('데이터베이스 항목 2')).toBeInTheDocument();

      // 미리 채워진 값 확인 (DB 타입 버튼)
      expect(screen.getByRole('button', { name: /Relational DB \(선택됨\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /NoSQL DB \(선택됨\)/i })).toBeInTheDocument();

      // 미리 채워진 값 확인 (DB 이름 버튼)
      expect(screen.getByRole('button', { name: /MySQL \(선택됨\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /MongoDB \(선택됨\)/i })).toBeInTheDocument();

      // 미리 채워진 값 확인 (버전 및 크기 입력 필드)
      expect(screen.getByLabelText(/MySQL 버전 선택/i)).toHaveValue('8.0.36 (LTS)');
      expect(screen.getByLabelText(/MongoDB 버전 선택/i)).toHaveValue('7.0');

      // !!! 수정된 부분: 레이블 텍스트에 항목 번호가 포함되지 않으므로 정규식 수정
      expect(screen.getByLabelText(/DB 크기 \(GB\)/i, { selector: '#db-size-input-100' })).toHaveValue(10);
      expect(screen.getByLabelText(/DB 크기 \(GB\)/i, { selector: '#db-size-input-101' })).toHaveValue(20);
    });

    expect(mockUpdateFormData).not.toHaveBeenCalled();
  });

  test('"+ 새 데이터베이스 항목 추가" 버튼 클릭 시 새 DB 항목이 추가됩니다', async () => {
    // 이 테스트에서는 초기 렌더링 시 Date.now()가 MOCK_INITIAL_ID_TIME을 반환하고,
    // 새 항목 추가 시 MOCK_NEW_ITEM_ID_TIME을 반환하도록 합니다.
    dateNowSpy
      .mockReturnValueOnce(MOCK_INITIAL_ID_TIME)
      .mockReturnValue(MOCK_NEW_ITEM_ID_TIME);

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${MOCK_INITIAL_ID_TIME}`)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: '+ 새 데이터베이스 항목 추가' });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${MOCK_NEW_ITEM_ID_TIME}`)).toBeInTheDocument();
      expect(screen.getByText('데이터베이스 항목 2')).toBeInTheDocument();
    });

    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'dbItems',
      expect.arrayContaining([
        expect.objectContaining({ id: MOCK_INITIAL_ID_TIME }),
        expect.objectContaining({ id: MOCK_NEW_ITEM_ID_TIME }),
      ])
    );
  });

  test('DB 항목 제거 버튼 클릭 시 DB 항목이 제거됩니다', async () => {
    const initialData = [
      { id: MOCK_INITIAL_ID_TIME, type: '', name: '', version: '', size: '' },
      { id: MOCK_NEW_ITEM_ID_TIME, type: '', name: '', version: '', size: '' },
    ];

    // 이 테스트에서는 Date.now()를 mock할 필요가 없습니다. 이미 formData에 ID가 정의되어 있습니다.
    // 하지만 beforeEach에서 dateNowSpy가 mock되므로, 기본 동작을 유지합니다.
    (useSurvey as jest.Mock).mockReturnValue({
      formData: { dbItems: initialData },
      updateFormData: mockUpdateFormData,
    });

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${MOCK_INITIAL_ID_TIME}`)).toBeInTheDocument();
      expect(screen.getByTestId(`db-item-${MOCK_NEW_ITEM_ID_TIME}`)).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: `데이터베이스 항목 1 삭제` });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByTestId(`db-item-${MOCK_INITIAL_ID_TIME}`)).not.toBeInTheDocument();
      expect(screen.getByTestId(`db-item-${MOCK_NEW_ITEM_ID_TIME}`)).toBeInTheDocument();
      expect(screen.getByText('데이터베이스 항목 1')).toBeInTheDocument();
    });

    expect(mockUpdateFormData).toHaveBeenCalledWith(
      'dbItems',
      expect.arrayContaining([
        expect.objectContaining({ id: MOCK_NEW_ITEM_ID_TIME }),
      ])
    );
    expect(mockUpdateFormData).not.toHaveBeenCalledWith(
      'dbItems',
      expect.arrayContaining([
        expect.objectContaining({ id: MOCK_INITIAL_ID_TIME }),
      ])
    );
  });

  test('DB 타입 선택 및 선택 해제', async () => {
    const itemId = MOCK_INITIAL_ID_TIME;
    dateNowSpy.mockReturnValue(itemId); // 이 테스트에서는 하나의 항목만 있으므로 이 ID를 사용

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${itemId}`)).toBeInTheDocument();
    });

    const relationalDbButton = screen.getByRole('button', { name: /Relational DB/i });
    fireEvent.click(relationalDbButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Relational DB \(선택됨\)/i })).toBeInTheDocument();
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        'dbItems',
        expect.arrayContaining([
          expect.objectContaining({ id: itemId, type: 'relational' }),
        ])
      );
    });

    fireEvent.click(relationalDbButton); // 다시 클릭하여 선택 해제

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Relational DB/i })).toBeInTheDocument(); // 이제 선택되지 않음
      expect(screen.queryByRole('button', { name: /Relational DB \(선택됨\)/i })).not.toBeInTheDocument();
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        'dbItems',
        expect.arrayContaining([
          expect.objectContaining({ id: itemId, type: '' }),
        ])
      );
    });
  });

  test('DB 이름 업데이트', async () => {
    const itemId = MOCK_INITIAL_ID_TIME;
    dateNowSpy.mockReturnValue(itemId);

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${itemId}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Relational DB/i }));
    await waitFor(() => {
      expect(screen.getByText('relational 데이터베이스 선택')).toBeInTheDocument();
    });

    const mysqlButton = screen.getByRole('button', { name: /MySQL/i });
    fireEvent.click(mysqlButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /MySQL \(선택됨\)/i })).toBeInTheDocument();
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        'dbItems',
        expect.arrayContaining([
          expect.objectContaining({ id: itemId, name: 'mysql' }),
        ])
      );
    });
  });

  test('DB 버전 업데이트', async () => {
    const itemId = MOCK_INITIAL_ID_TIME;
    dateNowSpy.mockReturnValue(itemId);

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${itemId}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Relational DB/i }));
    await waitFor(() => expect(screen.getByText('relational 데이터베이스 선택')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /MySQL/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /MySQL \(선택됨\)/i })).toBeInTheDocument());

    // 레이블 텍스트가 'MySQL 버전 선택'임을 확인
    const versionSelect = screen.getByRole('combobox', { name: /MySQL 버전 선택/i });
    fireEvent.change(versionSelect, { target: { value: '8.0.36 (LTS)' } });

    await waitFor(() => {
      expect(versionSelect).toHaveValue('8.0.36 (LTS)');
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        'dbItems',
        expect.arrayContaining([
          expect.objectContaining({ id: itemId, version: '8.0.36 (LTS)' }),
        ])
      );
    });
  });

  test('DB 크기 업데이트', async () => {
    const itemId = MOCK_INITIAL_ID_TIME;
    dateNowSpy.mockReturnValue(itemId);

    render(<Step8_DB />);

    await waitFor(() => {
      expect(screen.getByTestId(`db-item-${itemId}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Relational DB/i }));
    await waitFor(() => expect(screen.getByText('relational 데이터베이스 선택')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /MySQL/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /MySQL \(선택됨\)/i })).toBeInTheDocument());

    // !!! 수정된 부분: 레이블 텍스트에 항목 번호가 포함되지 않으므로 정규식 수정
    const sizeInput = screen.getByLabelText(/DB 크기 \(GB\)/i, { selector: `#db-size-input-${itemId}` });
    fireEvent.change(sizeInput, { target: { value: '500' } });

    await waitFor(() => {
      expect(sizeInput).toHaveValue(500);
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        'dbItems',
        expect.arrayContaining([
          expect.objectContaining({ id: itemId, size: '500' }),
        ])
      );
    });
  });

  test('DB 크기가 유효하지 않은 경우 에러 메시지를 표시합니다', async () => {
    const itemId = MOCK_INITIAL_ID_TIME;
    dateNowSpy.mockReturnValue(itemId);

    render(<Step8_DB />);

    fireEvent.click(screen.getByRole('button', { name: /Relational DB/i }));
    fireEvent.click(screen.getByRole('button', { name: /MySQL/i }));

    // !!! 수정된 부분: 레이블 텍스트에 항목 번호가 포함되지 않으므로 정규식 수정
    const sizeInput = await screen.findByLabelText(/DB 크기 \(GB\)/i, { selector: `#db-size-input-${itemId}` });
    fireEvent.change(sizeInput, { target: { value: '0' } });

    await waitFor(() => {
      expect(screen.getByText('유효한 크기를 입력해주세요.')).toBeInTheDocument();
    });

    fireEvent.change(sizeInput, { target: { value: '-10' } });

    await waitFor(() => {
      expect(screen.getByText('유효한 크기를 입력해주세요.')).toBeInTheDocument();
    });

    fireEvent.change(sizeInput, { target: { value: '100' } });

    await waitFor(() => {
      expect(screen.queryByText('유효한 크기를 입력해주세요.')).not.toBeInTheDocument();
    });
  });
});