import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportForm from './ReportForm';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

// Mock global fetch for formsubmit
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
} as any);

describe('ReportForm', () => {
  let mockInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });
  });

  it('submits form with reporter_contact when provided', async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText(/اسم الشاليه/i), {
      target: { value: 'شاليه التجربة' },
    });
    fireEvent.change(screen.getByLabelText(/المدينة والحي/i), {
      target: { value: 'الرياض - النرجس' },
    });
    fireEvent.change(screen.getByLabelText(/سبب البلاغ/i), {
      target: { value: 'إعلان وهمي أو مضلل' },
    });
    fireEvent.change(screen.getByLabelText(/تفاصيل البلاغ/i), {
      target: { value: 'تفاصيل المخالفة للاختبار' },
    });
    fireEvent.change(screen.getByLabelText(/بريدك الإلكتروني أو رقم هاتفك/i), {
      target: { value: 'reporter@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /إرسال البلاغ الآن/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    expect(mockInsert).toHaveBeenCalledWith({
      chalet_name: 'شاليه التجربة (الرياض - النرجس)',
      reason: 'إعلان وهمي أو مضلل',
      details: 'تفاصيل المخالفة للاختبار',
      reporter_contact: 'reporter@example.com',
    });
  });

  it('submits form with reporter_contact as null when left empty', async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText(/اسم الشاليه/i), {
      target: { value: 'شاليه التجربة 2' },
    });
    fireEvent.change(screen.getByLabelText(/المدينة والحي/i), {
      target: { value: 'جدة - أبحر' },
    });
    fireEvent.change(screen.getByLabelText(/سبب البلاغ/i), {
      target: { value: 'أخرى' },
    });
    fireEvent.change(screen.getByLabelText(/تفاصيل البلاغ/i), {
      target: { value: 'تفاصيل أخرى للاختبار' },
    });

    fireEvent.click(screen.getByRole('button', { name: /إرسال البلاغ الآن/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    expect(mockInsert).toHaveBeenCalledWith({
      chalet_name: 'شاليه التجربة 2 (جدة - أبحر)',
      reason: 'أخرى',
      details: 'تفاصيل أخرى للاختبار',
      reporter_contact: null,
    });
  });
});
