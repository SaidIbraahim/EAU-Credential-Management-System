import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentRegistrationForm from '../StudentRegistrationForm';
import { studentsApi, documentsApi, auditLogApi } from '@/api/apiClient';

// Mock the API clients
vi.mock('@/api/apiClient', () => ({
  studentsApi: {
    getAll: vi.fn(),
    create: vi.fn()
  },
  documentsApi: {
    upload: vi.fn()
  },
  auditLogApi: {
    logAction: vi.fn()
  }
}));

describe('StudentRegistrationForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API responses
    (studentsApi.getAll as any).mockResolvedValue({ data: [] });
    (studentsApi.create as any).mockResolvedValue({ id: 1, ...testStudent });
    (documentsApi.upload as any).mockResolvedValue({ id: 1 });
    (auditLogApi.logAction as any).mockResolvedValue({});
  });

  const testStudent = {
    full_name: "John Doe",
    registration_no: "GRW-BCS-2024",
    certificate_id: "2024",
    gender: "male",
    phone_number: "+1234567890",
    faculty_id: "1",
    department_id: "1",
    academic_year_id: "1",
    gpa: 3.75,
    grade: "A",
    graduation_date: "2024-05-30",
    status: "un-cleared"
  };

  it('renders all form fields', () => {
    render(<StudentRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Personal Info Fields
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/registration number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/certificate id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();

    // Academic Info Fields
    expect(screen.getByLabelText(/faculty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/academic year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gpa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/graduation date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();

    // Document Upload Section
    expect(screen.getByText(/photo/i)).toBeInTheDocument();
    expect(screen.getByText(/transcript/i)).toBeInTheDocument();
    expect(screen.getByText(/certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/supporting documents/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(<StudentRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill personal info
    await userEvent.type(screen.getByLabelText(/full name/i), testStudent.full_name);
    await userEvent.type(screen.getByLabelText(/registration number/i), testStudent.registration_no);
    await userEvent.type(screen.getByLabelText(/certificate id/i), testStudent.certificate_id);
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), testStudent.gender);
    await userEvent.type(screen.getByLabelText(/phone number/i), testStudent.phone_number);

    // Fill academic info
    await userEvent.selectOptions(screen.getByLabelText(/faculty/i), testStudent.faculty_id);
    await userEvent.selectOptions(screen.getByLabelText(/department/i), testStudent.department_id);
    await userEvent.selectOptions(screen.getByLabelText(/academic year/i), testStudent.academic_year_id);
    await userEvent.type(screen.getByLabelText(/gpa/i), testStudent.gpa.toString());
    await userEvent.type(screen.getByLabelText(/grade/i), testStudent.grade);
    await userEvent.type(screen.getByLabelText(/graduation date/i), testStudent.graduation_date);
    await userEvent.selectOptions(screen.getByLabelText(/status/i), testStudent.status);

    // Upload documents
    const photoInput = screen.getByLabelText(/upload photo/i);
    const transcriptInput = screen.getByLabelText(/upload transcript/i);
    const certificateInput = screen.getByLabelText(/upload certificate/i);
    const supportingInput = screen.getByLabelText(/upload supporting/i);

    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    await userEvent.upload(photoInput, testFile);
    await userEvent.upload(transcriptInput, testFile);
    await userEvent.upload(certificateInput, testFile);
    await userEvent.upload(supportingInput, testFile);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    // Verify API calls
    await waitFor(() => {
      expect(studentsApi.create).toHaveBeenCalledWith(expect.objectContaining({
        full_name: testStudent.full_name,
        registration_no: testStudent.registration_no,
        certificate_id: testStudent.certificate_id
      }));
      expect(documentsApi.upload).toHaveBeenCalledTimes(4);
      expect(auditLogApi.logAction).toHaveBeenCalledTimes(2);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    render(<StudentRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/registration number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/department is required/i)).toBeInTheDocument();
      expect(screen.getByText(/academic year is required/i)).toBeInTheDocument();
    });
  });

  it('prevents duplicate registration numbers', async () => {
    (studentsApi.getAll as any).mockResolvedValue({
      data: [{ student_id: testStudent.registration_no }]
    });

    render(<StudentRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill required fields
    await userEvent.type(screen.getByLabelText(/full name/i), testStudent.full_name);
    await userEvent.type(screen.getByLabelText(/registration number/i), testStudent.registration_no);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration number.*already exists/i)).toBeInTheDocument();
    });
  });

  it('handles form cancellation', async () => {
    render(<StudentRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
}); 