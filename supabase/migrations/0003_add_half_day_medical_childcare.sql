-- Add half-day variants for medical and childcare leave to the leave_type enum.
-- Run this in the Supabase SQL editor.

alter type leave_type add value if not exists 'medical_am';
alter type leave_type add value if not exists 'medical_pm';
alter type leave_type add value if not exists 'childcare_am';
alter type leave_type add value if not exists 'childcare_pm';
