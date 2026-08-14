import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type VacancyListing = {
  id: string;
  chalet_name: string;
  section_number: string | null;
  price: number;
  contact_phone: string;
  map_url: string;
  publish_status: 'active' | 'reserved';
  city_name: string;
  area_name: string;
  notes?: string | null;
  region_direction?: string | null;
};
