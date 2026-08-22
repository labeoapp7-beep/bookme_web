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
  section_number?: string | null;
  price: number;
  contact_phone: string;
  map_url?: string | null;
  publish_status: 'active' | 'reserved';
  city_name: string;
  area_name: string;
  street_name?: string | null;
  region_direction?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

export const DIRECTION_OPTIONS = [
  { id: 'all', label: 'جميع الاتجاهات' },
  { id: 'north', label: 'شمال' },
  { id: 'south', label: 'جنوب' },
  { id: 'east', label: 'شرق' },
  { id: 'west', label: 'غرب' },
  { id: 'center', label: 'وسط' },
] as const;

/**
 * Normalizes direction strings in English or Arabic to a standard key ('north', 'south', 'east', 'west', 'center')
 */
export function normalizeDirection(dir?: string | null): string {
  if (!dir) return '';
  const d = dir.trim().toLowerCase();
  if (d === 'north' || d === 'شمال' || d.includes('شمال')) return 'north';
  if (d === 'south' || d === 'جنوب' || d.includes('جنوب')) return 'south';
  if (d === 'east' || d === 'شرق' || d.includes('شرق')) return 'east';
  if (d === 'west' || d === 'غرب' || d.includes('غرب')) return 'west';
  if (d === 'center' || d === 'وسط' || d.includes('وسط')) return 'center';
  return d;
}

/**
 * Gets the Arabic label for any direction key or string
 */
export function getDirectionDisplay(dir?: string | null): string | null {
  if (!dir) return null;
  const normalized = normalizeDirection(dir);
  const found = DIRECTION_OPTIONS.find(opt => opt.id === normalized);
  return found && found.id !== 'all' ? found.label : dir.trim();
}
