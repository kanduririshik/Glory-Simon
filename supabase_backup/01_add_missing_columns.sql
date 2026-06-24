-- ============================================================
-- Supabase Schema Audit & Repair Migration
-- Run this in your Supabase SQL Editor to add any missing columns.
-- ============================================================

-- 1. ENQUIRIES TABLE
ALTER TABLE IF EXISTS enquiries 
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS phone_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sq_ft_area numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_style text,
  ADD COLUMN IF NOT EXISTS requirements text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'New Lead',
  ADD COLUMN IF NOT EXISTS assigned_staff_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. STATUS HISTORY TABLE
ALTER TABLE IF EXISTS status_history
  ADD COLUMN IF NOT EXISTS enquiry_id uuid,
  ADD COLUMN IF NOT EXISTS old_status text,
  ADD COLUMN IF NOT EXISTS new_status text,
  ADD COLUMN IF NOT EXISTS changed_by_id text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. SITE VISITS TABLE
ALTER TABLE IF EXISTS site_visits
  ADD COLUMN IF NOT EXISTS enquiry_id uuid,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Scheduled',
  ADD COLUMN IF NOT EXISTS engineer_id text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. QUOTATIONS TABLE
ALTER TABLE IF EXISTS quotations
  ADD COLUMN IF NOT EXISTS quotation_number text,
  ADD COLUMN IF NOT EXISTS enquiry_id uuid,
  ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 5. COMMUNICATION LOGS TABLE
ALTER TABLE IF EXISTS communication_logs
  ADD COLUMN IF NOT EXISTS enquiry_id uuid,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS template_name text,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Sent',
  ADD COLUMN IF NOT EXISTS sent_by_id text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 6. NOTIFICATIONS TABLE
ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS read boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS enquiry_id uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 7. AI LOGS TABLE
ALTER TABLE IF EXISTS ai_logs
  ADD COLUMN IF NOT EXISTS enquiry_id uuid,
  ADD COLUMN IF NOT EXISTS prompt_type text,
  ADD COLUMN IF NOT EXISTS response jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 8. USER PROFILES TABLE
ALTER TABLE IF EXISTS user_profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ============================================================
-- CRITICAL FIX: Reload the PostgREST Schema Cache
-- ============================================================
-- If the column exists but Supabase throws "not found in schema cache",
-- this command forces Supabase to refresh its API definitions.
NOTIFY pgrst, 'reload schema';
