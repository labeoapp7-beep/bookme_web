import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VacanciesBoard } from './VacanciesBoard';

// Mock Supabase
vi.mock('../lib/supabase', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../lib/supabase')>();
  
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: function(resolve: any) {
      resolve({
        data: [
          {
            id: '1',
            chalet_name: 'شاليه الرمال',
            city_name: 'الرياض',
            area_name: 'الياسمين',
            street_name: 'طريق الملك عبدالعزيز',
            region_direction: 'north',
            price: 500,
            publish_status: 'active',
            contact_phone: '0500000000'
          },
          {
            id: '2',
            chalet_name: 'شاليه الغروب',
            city_name: 'جدة',
            area_name: 'الشاطئ',
            region_direction: 'west',
            price: 800,
            publish_status: 'active',
            contact_phone: '0511111111'
          }
        ],
        error: null
      });
    }
  };

  return {
    ...mod,
    supabase: {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
      channel: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      removeChannel: vi.fn(),
    }
  };
});

describe('VacanciesBoard filtering logic', () => {
  it('renders listings correctly and handles search', async () => {
    render(<VacanciesBoard />);
    
    // Wait for the query to finish and elements to appear
    const rimalChalet = await screen.findByText('شاليه الرمال');
    expect(rimalChalet).toBeInTheDocument();
    expect(screen.getByText('شاليه الغروب')).toBeInTheDocument();

    // Test Search by name
    const searchInput = screen.getByPlaceholderText(/ابحث عن الشاليه/i);
    fireEvent.change(searchInput, { target: { value: 'الرمال' } });

    expect(screen.getByText('شاليه الرمال')).toBeInTheDocument();
    expect(screen.queryByText('شاليه الغروب')).not.toBeInTheDocument();

    // Clear search
    const clearBtn = screen.getByTitle('مسح البحث');
    fireEvent.click(clearBtn);
    expect(screen.getByText('شاليه الغروب')).toBeInTheDocument();

    // Test City filter
    const citySelect = screen.getByRole('combobox', { name: /تصفية حسب المدينة/i });
    fireEvent.change(citySelect, { target: { value: 'جدة' } });

    expect(screen.queryByText('شاليه الرمال')).not.toBeInTheDocument();
    expect(screen.getByText('شاليه الغروب')).toBeInTheDocument();
    
    // Reset filters
    const resetBtn = screen.getByTitle('إعادة ضبط الفلاتر');
    fireEvent.click(resetBtn);
    expect(screen.getByText('شاليه الرمال')).toBeInTheDocument();
  });
});
