import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step3_VMResources from '@/components/FormStep/Step3_VMResources';
import { FormDataType } from '@/types/survey';

// Mock the useSurvey hook
const mockUpdateFormData = jest.fn();

const mockInitialFormData: FormDataType = {
  env: 'paas',
  k8s: { type: 'kubernetes', version: '', node: '', namespace: '' },
  vm: {
    environment: 'on-premise', ec2Type: '', ebsType: '', ebsSize: '',
    hostname: '',
    username: ''
  },
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

describe('Step3_VMResources', () => {
  beforeEach(() => {
    mockUpdateFormData.mockClear();
    jest.spyOn(require('@/context/SurveyContext'), 'useSurvey').mockReturnValue({
      formData: mockInitialFormData,
      updateFormData: mockUpdateFormData,
      currentStep: 1,
      setCurrentStep: jest.fn(),
      goToNextStep: jest.fn(),
      goToPrevStep: jest.fn(),
      TOTAL_STEPS: 0,
    });
  });

  const renderStep3VMResources = () => {
    return render(<Step3_VMResources />);
  };

  it('renders the environment select input and switches to AWS options', () => {
    renderStep3VMResources();

    expect(screen.getByLabelText('환경')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '환경' })).toHaveValue('on-premise');

    fireEvent.change(screen.getByRole('combobox', { name: '환경' }), { target: { value: 'aws' } });

    expect(screen.getByRole('combobox', { name: 'EC2 인스턴스 타입' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'EBS 볼륨 타입' })).toBeInTheDocument();
  });

  it('updates CPU, RAM, and DISK when input is valid for on-premise environment', async () => {
    renderStep3VMResources();

    fireEvent.change(screen.getByPlaceholderText('예: 4'), { target: { value: '4' } });
    fireEvent.change(screen.getByPlaceholderText('예: 16'), { target: { value: '16' } });
    fireEvent.change(screen.getByPlaceholderText('예: 100'), { target: { value: '100' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('resources', expect.objectContaining({
        cpu: '4',
        ram: '16',
        disk: '100'
      }));
    });
  });

  // Now these tests should pass with the updated validation logic
  it('shows error message for invalid CPU input (non-numeric)', async () => {
    renderStep3VMResources();

    fireEvent.change(screen.getByPlaceholderText('예: 4'), { target: { value: 'abc' } });

    await waitFor(() => {
      expect(screen.getByText('CPU는 1 이상의 양수를 입력해주세요.')).toBeInTheDocument();
      // Also verify the input field is empty because of sanitization
      expect(screen.getByPlaceholderText('예: 4')).toHaveValue('');
    });
  });

  it('shows error message for invalid RAM input (negative number)', async () => {
    renderStep3VMResources();

    // Since our validateAndSanitizeInput now expects only digits, '-16' will be invalid
    fireEvent.change(screen.getByPlaceholderText('예: 16'), { target: { value: '-16' } });

    await waitFor(() => {
      expect(screen.getByText('RAM은 1 이상의 양수를 입력해주세요.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('예: 16')).toHaveValue('');
    });
  });

  it('shows error message for invalid disk input (non-numeric)', async () => {
    renderStep3VMResources();

    fireEvent.change(screen.getByPlaceholderText('예: 100'), { target: { value: 'disk' } });

    await waitFor(() => {
      expect(screen.getByText('DISK는 1 이상의 양수를 입력해주세요.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('예: 100')).toHaveValue('');
    });
  });

  it('updates EBS size and validates it for AWS environment', async () => {
    renderStep3VMResources();

    fireEvent.change(screen.getByRole('combobox', { name: '환경' }), { target: { value: 'aws' } });

    const ebsSizeInput = screen.getByPlaceholderText('예: 50');
    fireEvent.change(ebsSizeInput, { target: { value: '50' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({
        ebsSize: '50'
      }));
      expect(screen.getByText('EBS 볼륨 크기 (GB)')).toBeInTheDocument(); // Ensure the label is present
      expect(ebsSizeInput).toHaveValue('50'); // Ensure the value is set
    });
  });

  it('shows error message for invalid EBS size input (non-numeric)', async () => {
    renderStep3VMResources();

    fireEvent.change(screen.getByRole('combobox', { name: '환경' }), { target: { value: 'aws' } });

    const ebsSizeInput = screen.getByPlaceholderText('예: 50');
    fireEvent.change(ebsSizeInput, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(screen.getByText('EBS 볼륨 크기는 1 이상의 양수를 입력해주세요.')).toBeInTheDocument();
      expect(ebsSizeInput).toHaveValue('');
    });
  });

  it('updates EC2 type when selected for AWS environment', async () => {
    renderStep3VMResources();

    fireEvent.change(screen.getByRole('combobox', { name: '환경' }), { target: { value: 'aws' } });

    const ec2Select = screen.getByRole('combobox', { name: 'EC2 인스턴스 타입' });
    fireEvent.change(ec2Select, { target: { value: 't2.small' } });

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith('vm', expect.objectContaining({
        ec2Type: 't2.small'
      }));
    });
  });

  // Additional test for pasting non-numeric data
  it('handles paste event for CPU with non-numeric data', async () => {
    renderStep3VMResources();
    const cpuInput = screen.getByPlaceholderText('예: 4');
    fireEvent.paste(cpuInput, { clipboardData: { getData: () => 'abc' } });

    await waitFor(() => {
      expect(cpuInput).toHaveValue(''); // Should be sanitized to empty
      expect(screen.getByText('CPU는 1 이상의 양수를 입력해주세요.')).toBeInTheDocument();
    });
  });

  // Additional test for pasting valid numeric data
  it('handles paste event for CPU with valid numeric data', async () => {
    renderStep3VMResources();
    const cpuInput = screen.getByPlaceholderText('예: 4');
    fireEvent.paste(cpuInput, { clipboardData: { getData: () => '123' } });

    await waitFor(() => {
      expect(cpuInput).toHaveValue('123');
      expect(mockUpdateFormData).toHaveBeenCalledWith('resources', expect.objectContaining({
        cpu: '123'
      }));
      // Ensure error message is not present
      expect(screen.queryByText('CPU는 1 이상의 양수를 입력해주세요.')).not.toBeInTheDocument();
    });
  });

  // Test for pasting negative numbers (should be invalid now)
  it('handles paste event for RAM with negative numeric data', async () => {
    renderStep3VMResources();
    const ramInput = screen.getByPlaceholderText('예: 16');
    fireEvent.paste(ramInput, { clipboardData: { getData: () => '-100' } });

    await waitFor(() => {
      // The sanitized value will be '100', but validateAndSanitizeInput will make it invalid
      expect(ramInput).toHaveValue(''); 
      expect(screen.getByText('RAM은 1 이상의 양수를 입력해주세요.')).toBeInTheDocument();
    });
  });
});