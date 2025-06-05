import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import InitPage from './InitPage';

describe('InitPage (UI only)', () => {
  const renderWithProviders = async () => {
    await waitFor(() =>
      render(
        <MemoryRouter>
          <AuthProvider>
            <InitPage />
          </AuthProvider>
        </MemoryRouter>
      )
    );
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders input fields and login button', async () => {
    await renderWithProviders();
  
    expect(screen.getByPlaceholderText(/사번/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/부서를 선택하세요/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
  });
  
  

  it('updates input values', async () => {
    await renderWithProviders();
  
    fireEvent.change(screen.getByPlaceholderText(/사번/i), {
      target: { value: 'emp001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/비밀번호/i), {
      target: { value: '1234' },
    });
  
    // '부서를 선택하세요' 부분을 getByRole로 접근
    fireEvent.change(screen.getByRole('combobox', { name: /부서를 선택하세요/i }), {
      target: { value: '은행-IT인프라팀' },
    });
  
    expect(screen.getByPlaceholderText(/사번/i)).toHaveValue('emp001');
    expect(screen.getByPlaceholderText(/비밀번호/i)).toHaveValue('1234');
    expect(screen.getByRole('combobox', { name: /부서를 선택하세요/i })).toHaveValue('은행-IT인프라팀');
  });
  
  
  
  
  
  
  
});
