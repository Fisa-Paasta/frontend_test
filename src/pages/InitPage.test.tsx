// initpage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom'; // useNavigate를 목킹하지 않습니다.
import { AuthProvider } from '@/context/AuthContext';
import InitPage from './InitPage';
import { act } from 'react';

// useNavigate 훅을 목킹하지 않습니다. 실제 동작을 사용합니다.
// const mockNavigate = jest.fn(); // 이 줄을 삭제하거나 주석 처리합니다.
// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom'),
//   useNavigate: () => mockNavigate,
// })); // 이 블록을 삭제하거나 주석 처리합니다.

// fetch API를 목킹하여 로그인 API 호출을 시뮬레이션합니다.
global.fetch = jest.fn((url: RequestInfo | URL, init?: RequestInit) => {
  if (url === 'http://localhost:8080/api/login') {
    const body = JSON.parse(init?.body as string);
    // 임시 사용자 로그인 시뮬레이션
    if (body.id === '99991234' && body.password === 'user123!' && body.department === '카드-디지털개발팀') {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(), // Headers 객체 추가
        json: () => Promise.resolve({ token: 'test-user-token', name: '임시 사용자', role: 'user' }),
      } as Response);
    }
    // 임시 관리자 로그인 시뮬레이션
    if (body.id === '12345678' && body.password === 'VMware1!' && body.department === '은행-IT인프라팀') {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(), // Headers 객체 추가
          json: () => Promise.resolve({ token: 'test-admin-token', name: '테스트 관리자', role: 'admin' }),
        } as Response);
      }
    // 다른 유효한 API 로그인 시뮬레이션
    if (body.id === 'validUser' && body.password === 'validPassword!' && body.department === '은행-핀테크기획팀') {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(), // Headers 객체 추가
        json: () => Promise.resolve({ token: 'mock-jwt-token-123', name: 'Valid User', role: 'user' }),
      } as Response);
    }
    return Promise.resolve({
      ok: false,
      status: 401,
      headers: new Headers(), // Headers 객체 추가
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    } as Response);
  }
  // 토큰 검증 API 목킹
  if (url === 'http://localhost:8080/api/verify-token') {
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers(), // Headers 객체 추가
    } as Response);
  }
  return Promise.reject(new Error('not mocked'));
}) as jest.Mock;

describe('InitPage (UI only)', () => {
  const renderWithProviders = () => {
    return render(
      <MemoryRouter initialEntries={['/init']}>
        <AuthProvider>
          <Routes>
            <Route path="/init" element={<InitPage />} />
            <Route path="/home" element={<div>Home Page</div>} />
            <Route path="/admin" element={<div>Admin Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders input fields and login button', async () => {
    await act(async () => {
      renderWithProviders();
    });

    expect(screen.getByPlaceholderText(/사번/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/부서를 선택하세요/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
  });

  it('updates input values', async () => {
    await act(async () => {
      renderWithProviders();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/사번/i), {
      target: { value: 'emp001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/비밀번호/i), {
      target: { value: '1234' },
    });
    
    const departmentSelect = screen.getByRole('combobox', { name: /부서를 선택하세요/i });

    fireEvent.change(departmentSelect, {
      target: { value: '은행-IT인프라팀' }, 
    });

    expect(screen.getByPlaceholderText(/사번/i)).toHaveValue('emp001');
    expect(screen.getByPlaceholderText(/비밀번호/i)).toHaveValue('1234');
    expect(departmentSelect).toHaveValue('은행-IT인프라팀');
  });
    

  it('redirects to home page after successful login (temp user)', async () => {
    await act(async () => {
      renderWithProviders();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/사번/i), {
      target: { value: '99991234' },
    });
    fireEvent.change(screen.getByPlaceholderText(/비밀번호/i), {
      target: { value: 'user123!' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /부서를 선택하세요/i }), {
        target: { value: '카드-디지털개발팀' },
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /로그인/i }));
    });
    
    // mockNavigate를 사용하지 않으므로 이 검증은 더 이상 필요하지 않습니다.
    // expect(mockNavigate).toHaveBeenCalledWith('/home');

    // Home Page 텍스트가 나타날 때까지 기다립니다.
    await waitFor(() => expect(screen.getByText(/Home Page/i)).toBeInTheDocument());
  });

  it('redirects to admin page after successful login (temp admin)', async () => {
    await act(async () => {
      renderWithProviders();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/사번/i), {
      target: { value: '12345678' },
    });
    fireEvent.change(screen.getByPlaceholderText(/비밀번호/i), {
      target: { value: 'VMware1!' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /부서를 선택하세요/i }), {
        target: { value: '은행-IT인프라팀' },
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /로그인/i }));
    });
    
    // mockNavigate를 사용하지 않으므로 이 검증은 더 이상 필요하지 않습니다.
    // expect(mockNavigate).toHaveBeenCalledWith('/admin');

    // Admin Page 텍스트가 나타날 때까지 기다립니다.
    await waitFor(() => expect(screen.getByText(/Admin Page/i)).toBeInTheDocument());
  });
});