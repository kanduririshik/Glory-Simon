-- ============================================================
-- Glory Simon Interiors — Supabase PostgreSQL Schema
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ============================================================
-- 1. USER PROFILES (team members — not Supabase Auth users)
-- ============================================================
create table if not exists user_profiles (
  id          text primary key,
  full_name   text not null,
  email       text not null unique,
  role        text not null check (role in (
                'Admin', 'Project Manager', 'Interior Designer',
                'Site Engineer', 'Vendor Coordinator'
              )),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

comment on table user_profiles is 'Internal team members of Glory Simon Interiors.';


-- ============================================================
-- 2. ENQUIRIES (client leads)
-- ============================================================
create table if not exists enquiries (
  id                uuid primary key default gen_random_uuid(),
  client_name       text not null,
  phone_number      text not null default '',
  email             text not null default '',
  company_name      text not null default '',
  project_type      text not null check (project_type in (
                      'Home Interior', 'Office Interior', 'Commercial Interior'
                    )),
  location          text not null default '',
  budget            numeric not null default 0,
  sq_ft_area        numeric not null default 0,
  preferred_style   text not null check (preferred_style in (
                      'Modern', 'Luxury', 'Contemporary', 'Minimalist', 'Traditional'
                    )),
  requirements      text not null default '',
  notes             text not null default '',
  lead_source       text not null check (lead_source in (
                      'Website', 'WhatsApp', 'Instagram', 'Facebook', 'Referral', 'Walk-In'
                    )),
  priority          text not null default 'Medium' check (priority in (
                      'Low', 'Medium', 'High', 'Urgent'
                    )),
  status            text not null default 'New Lead' check (status in (
                      'New Lead', 'Follow Up', 'Site Visit Scheduled',
                      'Quotation Sent', 'Negotiation', 'Confirmed', 'Lost'
                    )),
  assigned_staff_id text references user_profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table enquiries is 'Client project enquiries / leads in the CRM pipeline.';

-- Auto-update updated_at on any row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger enquiries_updated_at
  before update on enquiries
  for each row execute function set_updated_at();


-- ============================================================
-- 3. STATUS HISTORY (lead stage transition audit log)
-- ============================================================
create table if not exists status_history (
  id              uuid primary key default gen_random_uuid(),
  enquiry_id      uuid not null references enquiries(id) on delete cascade,
  old_status      text,
  new_status      text not null,
  changed_by_id   text references user_profiles(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now()
);

comment on table status_history is 'Audit log of lead status transitions.';


-- ============================================================
-- 4. SITE VISITS
-- ============================================================
create table if not exists site_visits (
  id            uuid primary key default gen_random_uuid(),
  enquiry_id    uuid not null references enquiries(id) on delete cascade,
  scheduled_at  timestamptz not null,
  status        text not null default 'Scheduled' check (status in (
                  'Scheduled', 'Completed', 'Cancelled', 'Rescheduled'
                )),
  engineer_id   text references user_profiles(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table site_visits is 'Scheduled on-site property inspection visits.';

create or replace trigger site_visits_updated_at
  before update on site_visits
  for each row execute function set_updated_at();


-- ============================================================
-- 5. QUOTATIONS
-- ============================================================
create table if not exists quotations (
  id                uuid primary key default gen_random_uuid(),
  quotation_number  text not null unique,
  enquiry_id        uuid not null references enquiries(id) on delete cascade,
  amount            numeric not null default 0,
  status            text not null default 'Draft' check (status in (
                      'Draft', 'Sent', 'Approved', 'Rejected'
                    )),
  items             jsonb not null default '[]'::jsonb,
  sent_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table quotations is 'Project cost quotation proposals sent to clients.';

create or replace trigger quotations_updated_at
  before update on quotations
  for each row execute function set_updated_at();


-- ============================================================
-- 6. COMMUNICATION LOGS
-- ============================================================
create table if not exists communication_logs (
  id             uuid primary key default gen_random_uuid(),
  enquiry_id     uuid not null references enquiries(id) on delete cascade,
  type           text not null check (type in ('WhatsApp', 'Email')),
  direction      text not null check (direction in ('Inbound', 'Outbound')),
  template_name  text,
  content        text not null,
  status         text not null default 'Sent' check (status in ('Sent', 'Delivered', 'Failed')),
  sent_by_id     text references user_profiles(id) on delete set null,
  error_message  text,
  created_at     timestamptz not null default now()
);

comment on table communication_logs is 'WhatsApp and email communication history per client.';


-- ============================================================
-- 7. NOTIFICATIONS (in-app notification inbox)
-- ============================================================
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  type        text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read        boolean not null default false,
  enquiry_id  uuid references enquiries(id) on delete cascade,
  created_at  timestamptz not null default now()
);

comment on table notifications is 'In-app notification inbox entries.';


-- ============================================================
-- 8. AI LOGS
-- ============================================================
create table if not exists ai_logs (
  id           uuid primary key default gen_random_uuid(),
  enquiry_id   uuid not null references enquiries(id) on delete cascade,
  prompt_type  text not null check (prompt_type in (
                 'summarizer', 'follow_up', 'scoring', 'suggestions'
               )),
  response     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

comment on table ai_logs is 'AI-generated analysis and response logs per enquiry.';


-- ============================================================
-- 9. ENABLE REALTIME on key tables
-- ============================================================
-- Run these after creating tables (in Supabase Dashboard):
-- Table Editor → select table → Realtime → Enable
--
-- Or via SQL:
alter publication supabase_realtime add table enquiries;
alter publication supabase_realtime add table site_visits;
alter publication supabase_realtime add table quotations;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table communication_logs;


-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) — open policies for now
-- ============================================================
-- The app uses the anon key with no auth. Enable open RLS so
-- all CRUD works without authentication gates.
-- Tighten these when Supabase Auth is added later.

alter table user_profiles      enable row level security;
alter table enquiries          enable row level security;
alter table status_history     enable row level security;
alter table site_visits        enable row level security;
alter table quotations         enable row level security;
alter table communication_logs enable row level security;
alter table notifications      enable row level security;
alter table ai_logs            enable row level security;

-- Open anon policies (replace with auth-scoped policies later)
create policy "anon_all_user_profiles"      on user_profiles      for all using (true) with check (true);
create policy "anon_all_enquiries"          on enquiries          for all using (true) with check (true);
create policy "anon_all_status_history"     on status_history     for all using (true) with check (true);
create policy "anon_all_site_visits"        on site_visits        for all using (true) with check (true);
create policy "anon_all_quotations"         on quotations         for all using (true) with check (true);
create policy "anon_all_communication_logs" on communication_logs for all using (true) with check (true);
create policy "anon_all_notifications"      on notifications      for all using (true) with check (true);
create policy "anon_all_ai_logs"            on ai_logs            for all using (true) with check (true);
