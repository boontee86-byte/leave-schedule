-- Add 'full_day_block' to the leave_type enum.
-- Run this in the Supabase SQL editor.

alter type leave_type add value if not exists 'full_day_block';
