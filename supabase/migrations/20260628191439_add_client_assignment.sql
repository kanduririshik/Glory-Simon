-- Add assigned_staff_id column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS assigned_staff_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Enable RLS updates on policies if needed (since Admin policy uses SELECT 1 FROM user_profiles, it remains secure)
