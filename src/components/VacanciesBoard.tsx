import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, normalizeDirection, DIRECTION_OPTIONS, type VacancyListing } from '../lib/supabase';
import { ChaletCard } from './ChaletCard';
import './VacanciesBoard.css';
import { Search, Compass, MapPin, X, RotateCcw } from 'lucide-react';

const queryClient = new QueryClient();

function BoardContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');

  // Fetch initial data
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['vacancies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vac_public_view')
        .select('*')
        .order('publish_status', { ascending: true }) // active first, then reserved
        .order('chalet_name', { ascending: true });
        
      if (error) throw error;
      return data as VacancyListing[];
    }
  });

  // Setup Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public-vacancies-realtime')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'vac_updates'
      }, () => {
        // When any change happens, invalidate the query to refetch fresh data from the view
        queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (error) {
    return (
      <div className="error-container glass-panel">
        <p>عذراً، حدث خطأ أثناء تحميل الشواغر.</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['vacancies'] })}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // Filter logic
  const filteredListings = listings?.filter(listing => {
    const searchLower = searchQuery.trim().toLowerCase();
    
    const matchesSearch = !searchLower || 
      listing.chalet_name.toLowerCase().includes(searchLower) || 
      listing.area_name.toLowerCase().includes(searchLower) ||
      (listing.street_name && listing.street_name.toLowerCase().includes(searchLower)) ||
      listing.city_name.toLowerCase().includes(searchLower) ||
      (listing.notes && listing.notes.toLowerCase().includes(searchLower));
      
    const matchesCity = selectedCity === 'all' || listing.city_name === selectedCity;
    
    const matchesDirection = selectedDirection === 'all' || 
      normalizeDirection(listing.region_direction) === selectedDirection;
    
    return matchesSearch && matchesCity && matchesDirection;
  });

  // Extract unique cities for the filter
  const uniqueCities = Array.from(new Set(listings?.map(l => l.city_name).filter(Boolean) || []));

  const hasActiveFilters = searchQuery !== '' || selectedCity !== 'all' || selectedDirection !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedDirection('all');
  };

  return (
    <div className="vacancies-board">
      <div className="filters-section glass-panel">
        <div className="search-box">
          <Search className="search-icon text-muted" size={18} />
          <input 
            type="text" 
            placeholder="ابحث عن الشاليه، الحي، الشارع، أو المدينة..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search-btn" 
              onClick={() => setSearchQuery('')}
              title="مسح البحث"
              aria-label="مسح البحث"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          {/* City Filter */}
          <div className="filter-select-wrapper">
            <MapPin size={16} className="select-icon text-muted" />
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="filter-select city-select"
              aria-label="تصفية حسب المدينة"
            >
              <option value="all">جميع المدن</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Direction Filter Dropdown */}
          <div className="filter-select-wrapper">
            <Compass size={16} className="select-icon text-muted" />
            <select 
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="filter-select direction-select"
              aria-label="تصفية حسب الاتجاه"
            >
              {DIRECTION_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button 
              className="reset-filters-btn" 
              onClick={handleResetFilters}
              title="إعادة ضبط الفلاتر"
            >
              <RotateCcw size={14} />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header / Status Bar */}
      {!isLoading && listings && (
        <div className="results-header">
          <span className="results-count">
            عرض {filteredListings?.length || 0} من أصل {listings.length} شاليه
          </span>
          {hasActiveFilters && (
            <div className="active-filters-badges">
              {selectedCity !== 'all' && (
                <span className="active-badge">
                  {selectedCity}
                  <button onClick={() => setSelectedCity('all')}><X size={12} /></button>
                </span>
              )}
              {selectedDirection !== 'all' && (
                <span className="active-badge">
                  {DIRECTION_OPTIONS.find(d => d.id === selectedDirection)?.label}
                  <button onClick={() => setSelectedDirection('all')}><X size={12} /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-card glass-panel" />
          ))}
        </div>
      ) : (
        <>
          {filteredListings?.length === 0 ? (
            <div className="empty-state glass-panel">
              <p className="text-h2">لا توجد شواغر مطابقة لبحثك 😔</p>
              <p className="text-muted">جرب البحث بكلمات أخرى أو اختر اتجاهاً أو مدينة مختلفة.</p>
              <button className="empty-reset-btn" onClick={handleResetFilters}>
                إظهار جميع الشاليهات
              </button>
            </div>
          ) : (
            <div className="vacancies-grid">
              {filteredListings?.map(listing => (
                <ChaletCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function VacanciesBoard() {
  return (
    <QueryClientProvider client={queryClient}>
      <BoardContent />
    </QueryClientProvider>
  );
}
