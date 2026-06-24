-- ========================================================================================
-- GLORY SIMON INTERIORS - DATABASE REPAIR MIGRATION
-- Migration Name: 03_migration_audit_fix
-- Idempotent script to fix missing tables, columns, constraints, indexes, RLS and realtime.
-- ========================================================================================

-- 1. ALTER AND REPAIR SITE VISITS
ALTER TABLE IF EXISTS site_visits
  ADD COLUMN IF NOT EXISTS engineer_id text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add engineer_id foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_visits_engineer_id_fkey'
  ) THEN
    ALTER TABLE site_visits
      ADD CONSTRAINT site_visits_engineer_id_fkey
      FOREIGN KEY (engineer_id) REFERENCES user_profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- 2. ALTER AND REPAIR QUOTATIONS
ALTER TABLE IF EXISTS quotations
  ADD COLUMN IF NOT EXISTS quotation_number text,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- Add quotation_number unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotations_quotation_number_key'
  ) THEN
    ALTER TABLE quotations
      ADD CONSTRAINT quotations_quotation_number_key
      UNIQUE (quotation_number);
  END IF;
END $$;


-- 3. ALTER AND REPAIR NOTIFICATIONS
ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS enquiry_id uuid;

-- Add enquiry_id foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_enquiry_id_fkey'
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_enquiry_id_fkey
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(id)
      ON DELETE CASCADE;
  END IF;
END $$;


-- 4. CREATE MISSING TABLES

-- Table: status_history
CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT status_history_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  CONSTRAINT status_history_changed_by_id_fkey FOREIGN KEY (changed_by_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Table: communication_logs
CREATE TABLE IF NOT EXISTS communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('WhatsApp', 'Email')),
  direction text NOT NULL CHECK (direction IN ('Inbound', 'Outbound')),
  template_name text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent', 'Delivered', 'Failed')),
  sent_by_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_logs_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  CONSTRAINT communication_logs_sent_by_id_fkey FOREIGN KEY (sent_by_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Table: ai_logs
CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type IN ('summarizer', 'follow_up', 'scoring', 'suggestions')),
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_logs_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
);


-- 5. CREATE INDEXES FOR FOREIGN KEYS AND PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_staff_id ON enquiries(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_status_history_enquiry_id ON status_history(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_by_id ON status_history(changed_by_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_enquiry_id ON site_visits(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_engineer_id ON site_visits(engineer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_enquiry_id ON quotations(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_enquiry_id ON communication_logs(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_sent_by_id ON communication_logs(sent_by_id);
CREATE INDEX IF NOT EXISTS idx_notifications_enquiry_id ON notifications(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_enquiry_id ON ai_logs(enquiry_id);


-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;


-- 7. CONFIGURE OPEN ANON POLICIES FOR ALL TABLES (CRUD ENABLED)
DROP POLICY IF EXISTS anon_all_user_profiles ON user_profiles;
CREATE POLICY anon_all_user_profiles ON user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_enquiries ON enquiries;
CREATE POLICY anon_all_enquiries ON enquiries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_status_history ON status_history;
CREATE POLICY anon_all_status_history ON status_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_site_visits ON site_visits;
CREATE POLICY anon_all_site_visits ON site_visits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_quotations ON quotations;
CREATE POLICY anon_all_quotations ON quotations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_communication_logs ON communication_logs;
CREATE POLICY anon_all_communication_logs ON communication_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_notifications ON notifications;
CREATE POLICY anon_all_notifications ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_ai_logs ON ai_logs;
CREATE POLICY anon_all_ai_logs ON ai_logs FOR ALL USING (true) WITH CHECK (true);


-- 8. PUBLISH REALTIME BROADCAST CHANNELS
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE enquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE site_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE communication_logs;


-- 9. CACHE AND SCHEMAS DEFINITION RELOAD
NOTIFY pgrst, 'reload schema';
