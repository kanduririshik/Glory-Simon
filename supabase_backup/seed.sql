-- ============================================================
-- Glory Simon Interiors — Supabase Seed Data
-- ============================================================
-- Run this AFTER schema.sql in: Supabase Dashboard → SQL Editor
-- This seeds all mock data so the app looks identical to
-- the localStorage version on first launch.
-- ============================================================


-- ============================================================
-- 1. USER PROFILES (team members)
-- ============================================================
insert into user_profiles (id, full_name, email, role, avatar_url, created_at) values
  ('p1', 'Glory Simon',    'glory@glorysimon.com',      'Admin',               'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60', '2025-01-01T00:00:00Z'),
  ('p2', 'Sarah Jenkins',  'sarah.j@glorysimon.com',    'Project Manager',     'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=60', '2025-01-10T00:00:00Z'),
  ('p3', 'Michael Chen',   'michael.c@glorysimon.com',  'Interior Designer',   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60', '2025-01-15T00:00:00Z'),
  ('p4', 'David Ross',     'david.r@glorysimon.com',    'Site Engineer',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60', '2025-02-01T00:00:00Z'),
  ('p5', 'Elena Rostova',  'elena.r@glorysimon.com',    'Vendor Coordinator',  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60', '2025-02-10T00:00:00Z')
on conflict (id) do nothing;


-- ============================================================
-- 2. ENQUIRIES (client leads)
-- ============================================================
insert into enquiries (
  id, client_name, phone_number, email, company_name,
  project_type, location, budget, sq_ft_area, preferred_style,
  requirements, notes, lead_source, priority, status,
  assigned_staff_id, created_at, updated_at
) values
  (
    'a1b2c3d4-0001-0000-0000-000000000001',
    'Alistair Sterling', '+1 (555) 019-2834', 'alistair@sterlingholdings.com', 'Sterling Holdings',
    'Commercial Interior', 'Penthouse Suite, Manhattan', 450000, 5200, 'Luxury',
    'Complete redesign of executive holding chambers, private lounge, and presentation boardroom. Client requests custom gold-plated fixtures, Italian marble accents, and smart ambient dimming.',
    'Alistair was referred by our previous client. Prefers communication over WhatsApp during weekends and email during weekdays. Extremely detail-oriented.',
    'Referral', 'Urgent', 'Negotiation', 'p3',
    '2026-05-15T10:00:00Z', '2026-06-03T16:45:00Z'
  ),
  (
    'a1b2c3d4-0002-0000-0000-000000000002',
    'Victoria Montgomery', '+1 (555) 048-9122', 'victoria@montgomery-estate.design', '',
    'Home Interior', 'Beverly Hills Villa', 850000, 12500, 'Traditional',
    'French Classical revival style for a 12,500 sq ft estate. Custom woodwork paneling, ornate ceilings, antique chandelier integration, and luxury walk-in wardrobes.',
    'Requested the principal designer (Glory) to oversee style direction personally. Highly conscious of timelines.',
    'Instagram', 'High', 'Site Visit Scheduled', 'p1',
    '2026-05-20T14:30:00Z', '2026-06-02T11:20:00Z'
  ),
  (
    'a1b2c3d4-0003-0000-0000-000000000003',
    'Julian Thorne', '+1 (555) 039-4822', 'julian@thornelaw.com', 'Thorne Legal Group',
    'Office Interior', '60th Floor, Financial Center', 280000, 3800, 'Minimalist',
    'Modern legal offices with acoustic dampening walls, glass partitions, oak meeting tables, and deep navy accents to convey authority and trust. Need workspace for 18 staff.',
    'Inquired through our web contact page. Responded within 10 minutes. Site visit completed.',
    'Website', 'Medium', 'Quotation Sent', 'p2',
    '2026-05-22T09:15:00Z', '2026-06-04T09:30:00Z'
  ),
  (
    'a1b2c3d4-0004-0000-0000-000000000004',
    'Dr. Sophia Patel', '+1 (555) 098-4321', 'dr.sophia.patel@luxcare.clinic', 'LuxCare Clinic',
    'Commercial Interior', 'Tribeca Medical Pavilion', 150000, 1800, 'Contemporary',
    'High-end cosmetic clinic lobby and consultation rooms. Soft lighting, botanical walls, curved pastel sofas, and sanitary but premium flooring.',
    'Exhibits high conversion interest. Worried about sanitation guidelines interfering with aesthetics.',
    'Walk-In', 'High', 'Follow Up', 'p3',
    '2026-05-28T11:00:00Z', '2026-06-01T15:20:00Z'
  ),
  (
    'a1b2c3d4-0005-0000-0000-000000000005',
    'Marcus & Elena Vance', '+1 (555) 077-8822', 'marcus.vance@vancetech.io', '',
    'Home Interior', 'Sausalito Coastal Residence', 600000, 4200, 'Modern',
    'Eco-friendly sustainable luxury retreat. Floor-to-ceiling glass, solar panel roof styling integration, custom teakwood furniture, and indoor koi pond.',
    'Fascinated by smart home features. WhatsApp logs show they love contemporary-modern designs.',
    'Facebook', 'Low', 'New Lead', 'p2',
    '2026-06-03T16:00:00Z', '2026-06-03T16:00:00Z'
  ),
  (
    'a1b2c3d4-0006-0000-0000-000000000006',
    'Jonathan Reed', '+1 (555) 012-7634', 'j.reed@reedhotels.com', 'Reed Boutique Hotels',
    'Commercial Interior', 'Soho Boutique Hotel Lobby', 1200000, 8500, 'Luxury',
    'Renovation of historic lobby space. Needs custom lighting design, bespoke brass furniture, velvet wall panels, and restoration of original moldings.',
    'Big ticket lead. Requires coordinate sign-off with historical preservation board.',
    'Referral', 'Urgent', 'Confirmed', 'p1',
    '2026-05-02T10:00:00Z', '2026-06-04T12:00:00Z'
  ),
  (
    'a1b2c3d4-0007-0000-0000-000000000007',
    'Clara Oswald', '+1 (555) 019-9999', 'clara@oswald-galleries.com', 'Oswald Art Gallery',
    'Commercial Interior', 'Chelsea Gallery District', 95000, 2500, 'Minimalist',
    'Art gallery renovation. Seamless white walls, track-lighting with high CRI values, hidden outlets, and raw concrete floors.',
    'Budget is too low for the extensive structural renovations needed. Closed as Lost.',
    'Website', 'Low', 'Lost', 'p3',
    '2026-05-10T11:00:00Z', '2026-05-25T14:00:00Z'
  )
on conflict (id) do nothing;


-- ============================================================
-- 3. STATUS HISTORY
-- ============================================================
insert into status_history (id, enquiry_id, old_status, new_status, changed_by_id, notes, created_at) values
  (
    'b1b2c3d4-0001-0000-0000-000000000001',
    'a1b2c3d4-0001-0000-0000-000000000001',
    'Quotation Sent', 'Negotiation', 'p2',
    'Client reviewed the quotation but requested a 10% volume discount on custom marble sourcing.',
    '2026-06-03T16:45:00Z'
  ),
  (
    'b1b2c3d4-0002-0000-0000-000000000002',
    'a1b2c3d4-0002-0000-0000-000000000002',
    'Follow Up', 'Site Visit Scheduled', 'p1',
    'Scheduled primary site measurements and structural layout inspection.',
    '2026-06-02T11:20:00Z'
  ),
  (
    'b1b2c3d4-0003-0000-0000-000000000003',
    'a1b2c3d4-0003-0000-0000-000000000003',
    'Site Visit Scheduled', 'Quotation Sent', 'p2',
    'Site visit findings integrated. Emailed the detailed quote proposal.',
    '2026-06-04T09:30:00Z'
  ),
  (
    'b1b2c3d4-0004-0000-0000-000000000004',
    'a1b2c3d4-0006-0000-0000-000000000006',
    'Negotiation', 'Confirmed', 'p1',
    'Contracts signed and initial 40% retainer received. Transitioning to design execution phase!',
    '2026-06-04T12:00:00Z'
  )
on conflict (id) do nothing;


-- ============================================================
-- 4. SITE VISITS
-- ============================================================
insert into site_visits (id, enquiry_id, scheduled_at, status, engineer_id, notes, created_at, updated_at) values
  (
    'c1b2c3d4-0001-0000-0000-000000000001',
    'a1b2c3d4-0002-0000-0000-000000000002',
    '2026-06-08T10:00:00Z', 'Scheduled', 'p4',
    'Verify load-bearing walls in the grand lobby, and inspect double-height ceiling structural integrity.',
    '2026-06-02T11:20:00Z', '2026-06-02T11:20:00Z'
  ),
  (
    'c1b2c3d4-0002-0000-0000-000000000002',
    'a1b2c3d4-0003-0000-0000-000000000003',
    '2026-05-30T14:00:00Z', 'Completed', 'p4',
    'Acoustic testing of workspace partition walls. Floor leveling checked and within acceptable parameters.',
    '2026-05-25T09:00:00Z', '2026-05-30T16:30:00Z'
  ),
  (
    'c1b2c3d4-0003-0000-0000-000000000003',
    'a1b2c3d4-0001-0000-0000-000000000001',
    '2026-05-24T11:00:00Z', 'Completed', 'p4',
    'Laser measurements of boardroom and lounge. Structural columns are confirmed in CAD diagram.',
    '2026-05-20T10:00:00Z', '2026-05-24T13:00:00Z'
  )
on conflict (id) do nothing;


-- ============================================================
-- 5. QUOTATIONS (items stored as JSONB)
-- ============================================================
insert into quotations (id, quotation_number, enquiry_id, amount, status, items, sent_at, created_at, updated_at) values
  (
    'd1b2c3d4-0001-0000-0000-000000000001',
    'QT-2026-001',
    'a1b2c3d4-0003-0000-0000-000000000003',
    280000, 'Sent',
    '[
      {"id":"qi1","description":"Acoustic partition walls and framing","quantity":1,"unitPrice":85000,"amount":85000},
      {"id":"qi2","description":"Bespoke Solid Oak legal library desks","quantity":4,"unitPrice":15000,"amount":60000},
      {"id":"qi3","description":"Premium ergonomic leather office chairs","quantity":18,"unitPrice":2500,"amount":45000},
      {"id":"qi4","description":"HVAC redesign and smart ambient controls","quantity":1,"unitPrice":35000,"amount":35000},
      {"id":"qi5","description":"Premium deep-navy velvet drapery & wallpapers","quantity":1,"unitPrice":20000,"amount":20000},
      {"id":"qi6","description":"Project management & interior designer fees","quantity":1,"unitPrice":35000,"amount":35000}
    ]'::jsonb,
    '2026-06-04T09:30:00Z', '2026-06-03T10:00:00Z', '2026-06-04T09:30:00Z'
  ),
  (
    'd1b2c3d4-0002-0000-0000-000000000002',
    'QT-2026-002',
    'a1b2c3d4-0001-0000-0000-000000000001',
    450000, 'Draft',
    '[
      {"id":"qi7","description":"Custom gold-plated fittings and gold-leaf details","quantity":1,"unitPrice":120000,"amount":120000},
      {"id":"qi8","description":"Italian Calacatta marble wall claddings & floor panels","quantity":1,"unitPrice":180000,"amount":180000},
      {"id":"qi9","description":"High-end smart lighting system (Crestron integrated)","quantity":1,"unitPrice":65000,"amount":65000},
      {"id":"qi10","description":"Boardroom conference table in brass and ebony wood","quantity":1,"unitPrice":50000,"amount":50000},
      {"id":"qi11","description":"Glory Simon signature project direction and design fees","quantity":1,"unitPrice":35000,"amount":35000}
    ]'::jsonb,
    null, '2026-06-02T15:00:00Z', '2026-06-02T15:00:00Z'
  ),
  (
    'd1b2c3d4-0003-0000-0000-000000000003',
    'QT-2026-003',
    'a1b2c3d4-0006-0000-0000-000000000006',
    1200000, 'Approved',
    '[
      {"id":"qi12","description":"Complete lobby demolition and historic restoration","quantity":1,"unitPrice":350000,"amount":350000},
      {"id":"qi13","description":"Restoration of original plaster moldings & archways","quantity":1,"unitPrice":180000,"amount":180000},
      {"id":"qi14","description":"Custom brass furniture & velvet structural panels","quantity":1,"unitPrice":290000,"amount":290000},
      {"id":"qi15","description":"Handcrafted glass centerpiece chandelier (Murano)","quantity":1,"unitPrice":220000,"amount":220000},
      {"id":"qi16","description":"Glory Simon senior architect signature retainer","quantity":1,"unitPrice":160000,"amount":160000}
    ]'::jsonb,
    '2026-05-25T11:00:00Z', '2026-05-20T10:00:00Z', '2026-06-04T12:00:00Z'
  )
on conflict (id) do nothing;


-- ============================================================
-- 6. COMMUNICATION LOGS
-- ============================================================
insert into communication_logs (id, enquiry_id, type, direction, template_name, content, status, sent_by_id, created_at) values
  (
    'e1b2c3d4-0001-0000-0000-000000000001',
    'a1b2c3d4-0001-0000-0000-000000000001',
    'WhatsApp', 'Outbound', 'Welcome Message',
    'Dear Alistair, thank you for reaching out to Glory Simon Interiors. We are thrilled to discuss the luxury renovation of your Manhattan Penthouse Suite. A designer from our team will contact you shortly.',
    'Delivered', 'p2', '2026-05-15T10:05:00Z'
  ),
  (
    'e1b2c3d4-0002-0000-0000-000000000002',
    'a1b2c3d4-0001-0000-0000-000000000001',
    'Email', 'Outbound', 'Welcome Email',
    'Dear Alistair,

Welcome to Glory Simon Interiors. It is our absolute pleasure to connect with you. We are currently analyzing the specifications for the Sterling Holdings Penthouse Suite.

Our design director, Glory Simon, has set aside time next week for a detailed design review with your board.

Warm regards,
Sarah Jenkins
Project Manager',
    'Sent', 'p2', '2026-05-15T10:10:00Z'
  ),
  (
    'e1b2c3d4-0003-0000-0000-000000000003',
    'a1b2c3d4-0002-0000-0000-000000000002',
    'WhatsApp', 'Outbound', 'Site Visit Confirmation',
    'Hi Victoria, this is to confirm your site visit for the Beverly Hills Villa on June 8 at 10:00 AM. Our Senior Site Engineer, David Ross, will lead the inspection.',
    'Delivered', 'p1', '2026-06-02T11:25:00Z'
  ),
  (
    'e1b2c3d4-0004-0000-0000-000000000004',
    'a1b2c3d4-0003-0000-0000-000000000003',
    'Email', 'Outbound', 'Quotation Email',
    'Dear Julian,

We have finalized the architectural layout and estimated materials breakdown for the Thorne Legal Offices.

Please find attached our formal quotation QT-2026-001 totaling $280,000.

We look forward to your approval to initiate marble ordering.

Sincerely,
Sarah Jenkins
Project Manager',
    'Sent', 'p2', '2026-06-04T09:35:00Z'
  )
on conflict (id) do nothing;


-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
insert into notifications (id, title, message, type, read, enquiry_id, created_at) values
  (
    'f1b2c3d4-0001-0000-0000-000000000001',
    'New Lead Registered',
    'Marcus & Elena Vance registered an enquiry for Sausalito Coastal Residence ($600,000 budget).',
    'info', false,
    'a1b2c3d4-0005-0000-0000-000000000005',
    '2026-06-03T16:01:00Z'
  ),
  (
    'f1b2c3d4-0002-0000-0000-000000000002',
    'Project Confirmed!',
    'Jonathan Reed approved QT-2026-003. Glory Simon Interiors confirmed a new $1.2M commercial account.',
    'success', false,
    'a1b2c3d4-0006-0000-0000-000000000006',
    '2026-06-04T12:00:00Z'
  ),
  (
    'f1b2c3d4-0003-0000-0000-000000000003',
    'Urgent Site Visit Scheduled',
    'Site visit scheduled for Victoria Montgomery (Beverly Hills Villa) on June 8, 10:00 AM.',
    'warning', true,
    'a1b2c3d4-0002-0000-0000-000000000002',
    '2026-06-02T11:20:00Z'
  )
on conflict (id) do nothing;
