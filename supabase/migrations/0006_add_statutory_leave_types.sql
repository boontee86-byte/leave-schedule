-- Add statutory leave types (parental, hospitalisation, compassionate,
-- national service, marriage, exam/study) with full-day + AM/PM variants
-- to the leave_type enum.
-- Run this in the Supabase SQL editor.

alter type leave_type add value if not exists 'parental';
alter type leave_type add value if not exists 'parental_am';
alter type leave_type add value if not exists 'parental_pm';
alter type leave_type add value if not exists 'hospitalisation';
alter type leave_type add value if not exists 'hospitalisation_am';
alter type leave_type add value if not exists 'hospitalisation_pm';
alter type leave_type add value if not exists 'compassionate';
alter type leave_type add value if not exists 'compassionate_am';
alter type leave_type add value if not exists 'compassionate_pm';
alter type leave_type add value if not exists 'national_service';
alter type leave_type add value if not exists 'national_service_am';
alter type leave_type add value if not exists 'national_service_pm';
alter type leave_type add value if not exists 'marriage';
alter type leave_type add value if not exists 'marriage_am';
alter type leave_type add value if not exists 'marriage_pm';
alter type leave_type add value if not exists 'exam_study';
alter type leave_type add value if not exists 'exam_study_am';
alter type leave_type add value if not exists 'exam_study_pm';
