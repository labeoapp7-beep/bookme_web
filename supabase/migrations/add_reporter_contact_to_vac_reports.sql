-- Migration: Add reporter_contact to vac_reports
-- Description: Stores the optional contact info (email/phone) submitted with a report

ALTER TABLE public.vac_reports
ADD COLUMN IF NOT EXISTS reporter_contact TEXT;
