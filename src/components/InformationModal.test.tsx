// components/InformationModal.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InformationModal from '@/components/InformationModal';
import { SurveyProvider } from '@/context/SurveyContext';

// InformationModal 컴포넌트의 Props 타입을 임포트합니다.
// InformationModal.tsx 파일의 가장 위에 interface Props { ... } 로 정의되어 있다면,
// 해당 인터페이스를 직접 export하지 않았을 가능성이 높습니다.
// 따라서, 테스트 파일에서 해당 Props 인터페이스를 다시 정의하는 것이 안전합니다.
// (실제 컴포넌트의 Props 정의와 완벽하게 일치해야 합니다.)
interface InformationModalProps {
  onClose: () => void;
  onSubmit: () => void;
  isOpen: boolean;
  title: string; // InformationModal 컴포넌트는 이 prop을 받지만, 내부에서 사용하지 않는 것으로 보입니다.
  message: string; // InformationModal 컴포넌트는 이 prop을 받지만, 내부에서 사용하지 않는 것으로 보입니다.
  icon: 'info' | 'success' | 'warning' | 'error';
}


describe('InformationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  // defaultProps는 InformationModalProps 타입을 명시적으로 지정
  const defaultProps: InformationModalProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    title: '안내', // 이 값은 실제 모달에서 렌더링되지 않습니다.
    message: '이것은 정보 메시지입니다.', // 이 값도 실제 모달에서 렌더링되지 않습니다.
    icon: 'info',
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  // InformationModal을 SurveyProvider로 감싸는 헬퍼 함수
  const renderInformationModal = (props: InformationModalProps = defaultProps) => {
    return render(
      <SurveyProvider>
        <InformationModal {...props} />
      </SurveyProvider>
    );
  };

  it('renders with correct fixed title and message', () => {
    renderInformationModal();

    // 이제 실제 InformationModal.tsx에 렌더링되는 고정된 텍스트를 찾습니다.
    expect(screen.getByText('신청서 상세 내역')).toBeInTheDocument();
    expect(screen.getByText('신청하신 인프라 환경의 상세 설정 내역을 확인하실 수 있습니다.')).toBeInTheDocument();

    // 기존 defaultProps.title과 message를 사용하는 부분은 제거합니다.
    // expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    // expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
  });

  it('calls onClose when the "닫기" button is clicked', () => { // 버튼 텍스트도 "확인"에서 "닫기"로 변경
    renderInformationModal();

    // "확인" 버튼이 아니라 "닫기" 버튼을 찾습니다.
    const closeButton = screen.getByRole('button', { name: /닫기/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when the "다음" button is clicked', () => { // onSubmit 테스트 케이스 추가 (선택 사항)
    renderInformationModal();

    // "다음" 버튼을 찾습니다.
    const nextButton = screen.getByRole('button', { name: /다음/i });
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(nextButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });


  it('does not render when isOpen is false', () => {
    renderInformationModal({ ...defaultProps, isOpen: false });

    // 이제 고정된 텍스트를 쿼리합니다.
    expect(screen.queryByText('신청서 상세 내역')).not.toBeInTheDocument();
    expect(screen.queryByText('신청하신 인프라 환경의 상세 설정 내역을 확인하실 수 있습니다.')).not.toBeInTheDocument();
  });
});