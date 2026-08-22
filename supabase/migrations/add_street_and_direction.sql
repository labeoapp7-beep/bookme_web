-- Migration: Add street_name and region_direction to vacancies
-- Description: Updates the underlying tables and views to support the new features (street names and region directions)

-- 1. Add new columns to the underlying chalets / vacancies table
-- NOTE: Replace "vacancies" with the actual name of your base table if it differs (e.g. "chalets")
ALTER TABLE public.vacancies 
ADD COLUMN IF NOT EXISTS street_name TEXT,
ADD COLUMN IF NOT EXISTS region_direction TEXT;

-- 2. Add constraint for region_direction (Optional but recommended for data integrity)
-- Accepts English keys or Arabic labels
ALTER TABLE public.vacancies 
ADD CONSTRAINT valid_region_direction 
CHECK (
  region_direction IS NULL OR 
  region_direction IN ('north', 'south', 'east', 'west', 'center', 'شمال', 'جنوب', 'شرق', 'غرب', 'وسط')
);

-- 3. Update the vac_public_view to expose these new columns
-- This recreates the view to include the newly added columns
CREATE OR REPLACE VIEW public.vac_public_view AS
SELECT 
    id,
    chalet_name,
    section_number,
    price,
    contact_phone,
    map_url,
    publish_status,
    city_name,
    area_name,
    street_name,
    region_direction,
    notes,
    created_at
FROM 
    public.vacancies
WHERE 
    publish_status IN ('active', 'reserved');

-- 4. Enable Realtime on the base table if not already enabled (for vac_updates or vacancies)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.vacancies;

-- 5. (Optional) Create vac_reports table if it doesn't exist yet for the Report feature
CREATE TABLE IF NOT EXISTS public.vac_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chalet_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions for vac_reports
GRANT INSERT ON public.vac_reports TO anon, authenticated;
