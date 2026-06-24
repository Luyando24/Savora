-- 0004_add_general_group_type.sql
-- Migration to add 'general' group type to groups table check constraint

ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_type_check;
ALTER TABLE public.groups ADD CONSTRAINT groups_type_check CHECK (type IN ('savings', 'agricultural', 'sacco', 'co-op', 'general'));
