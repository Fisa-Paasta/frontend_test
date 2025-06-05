import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom'; // MemoryRouter 추가
import Header from './Header'; // Header 컴포넌트 가져오기

// 로그인 상태로 렌더링하는 헬퍼 함수
const renderWithAuth = (value: AuthContextType) => {
  return render(
    <MemoryRouter>  {/* Router를 래핑 */}
      <AuthContext.Provider value={value}>
        <Header />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Header Component', () => {
  it('로그인 시 헤더에 사용자명이 표시되는지 확인', () => {
    const user = 'testuser';
    const mockLogout = jest.fn();
    const mockSetUser = jest.fn();
    const mockIsLoading = false;

    renderWithAuth({
      user: { userId: '123', userName: user, role: 'user' },
      logout: mockLogout,
      setUser: mockSetUser,
      isLoading: mockIsLoading,
    });

    // 사용자명이 화면에 렌더링되는지 확인
    expect(screen.getByText(user)).toBeInTheDocument();
  });

  it('로그인 시 헤더에 사용자명이 표시되는지 확인', () => {
    const user = 'testuser';
    const mockLogout = jest.fn();
    const mockSetUser = jest.fn();
    const mockIsLoading = false;
  
    renderWithAuth({
      user: { userId: '123', userName: user, role: 'user' },
      logout: mockLogout,
      setUser: mockSetUser,
      isLoading: mockIsLoading,
    });
  
    // 함수 매처를 사용하여 사용자명 찾기
    const userNameElement = screen.getByText((content, element) => 
      content.includes(user) && element.tagName.toLowerCase() === 'span'
    );
  
    // 사용자명이 화면에 렌더링되는지 확인
    expect(userNameElement).toBeInTheDocument();
  });
  
  
});
