import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, type VacancyListing } from '../lib/supabase';
import { ChaletCard } from './ChaletCard';
import './VacanciesBoard.css';
import { Search } from 'lucide-react';

const queryClient = new QueryClient();

function BoardContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');

  const directions = [
    { id: 'all', label: 'الكل' },
    { id: 'north', label: 'شمال' },
    { id: 'south', label: 'جنوب' },
    { id: 'east', label: 'شرق' },
    { id: 'west', label: 'غرب' },
  ];

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
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      listing.chalet_name.toLowerCase().includes(searchLower) || 
      listing.area_name.toLowerCase().includes(searchLower) ||
      (listing.street_name && listing.street_name.toLowerCase().includes(searchLower));
      
    const matchesCity = selectedCity === 'all' || listing.city_name === selectedCity;
    const matchesDirection = selectedDirection === 'all' || listing.region_direction === selectedDirection;
    
    return matchesSearch && matchesCity && matchesDirection;
  });

  // Extract unique cities for the filter
  const uniqueCities = Array.from(new Set(listings?.map(l => l.city_name) || []));

  return (
    <div className="vacancies-board">
      <div className="filters-section glass-panel">
        <div className="search-box">
          <Search className="search-icon text-muted" size={20} />
          <input 
            type="text" 
            placeholder="ابحث عن الشاليه، الحي، أو الشارع..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="city-filter">
          <select 
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedDirection('all'); // Reset direction when city changes
            }}
            className="city-select"
          >
            <option value="all">جميع المدن</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedCity !== 'all' && (
        <div className="directions-tabs">
          {directions.map(dir => {
            // Check if this direction actually has any listings in the selected city
            const hasListings = dir.id === 'all' || listings?.some(
              l => l.city_name === selectedCity && l.region_direction === dir.id
            );
            
            // If there are no listings for this direction, don't show the tab
            if (!hasListings) return null;

            return (
              <button
                key={dir.id}
                className={`direction-tab ${selectedDirection === dir.id ? 'active' : ''}`}
                onClick={() => setSelectedDirection(dir.id)}
              >
                {dir.label}
              </button>
            );
          })}
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
              <p className="text-muted">جرب البحث بكلمات أخرى أو اختر مدينة مختلفة.</p>
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
