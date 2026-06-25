-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    email_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    message_id TEXT,
    error_message TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on email_logs" ON public.email_logs;
CREATE POLICY "Allow all operations on email_logs" ON public.email_logs
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_email_logs" ON public.email_logs;
CREATE POLICY "anon_all_email_logs" ON public.email_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on email_templates" ON public.email_templates;
CREATE POLICY "Allow all operations on email_templates" ON public.email_templates
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_email_templates" ON public.email_templates;
CREATE POLICY "anon_all_email_templates" ON public.email_templates
    FOR ALL USING (true) WITH CHECK (true);

-- Seed default email templates
INSERT INTO public.email_templates (id, name, subject, body) VALUES
('welcome', 'Welcome Email', 'Welcome to Glory Simon Interiors', 'Dear {clientName},\n\nWelcome to Glory Simon Interiors. We are thrilled to discuss the luxury renovation of your {projectType} in {location}.\n\nOur design director, Glory Simon, has set aside time next week for a detailed design concept review.\n\nWarm regards,\nGlory Simon Interiors Team'),
('quotation', 'Quotation Email', 'Quotation {quotationNumber} from Glory Simon Interiors', 'Dear {clientName},\n\nWe have finalized the architectural layout and estimated materials breakdown for your project.\n\nPlease find attached our formal quotation {quotationNumber} totaling {amount} for your review.\n\nSincerely,\nSarah Jenkins\nProject Manager\nGlory Simon Interiors'),
('invoice', 'Invoice Email', 'Invoice {invoiceNumber} from Glory Simon Interiors', 'Dear {clientName},\n\nWe trust you are doing well.\n\nPlease find attached Invoice {invoiceNumber} for your project, totaling {amount}.\n\nKindly process the payment at your earliest convenience.\n\nSincerely,\nGlory Simon Interiors Finance Team'),
('site_visit', 'Site Visit Confirmation', 'Site Visit Scheduled: Glory Simon Interiors', 'Hi {clientName},\n\nThis is to confirm your site visit for the {location} property has been scheduled:\n\nDate: {date}\nTime: {time}\nAssigned Designer/Engineer: {staffName}\n\nOur team will contact you upon arrival. If you need to reschedule, please notify us.\n\nWarm regards,\nGlory Simon Interiors'),
('progress_update', 'Project Progress Update', 'Project Update: {projectName} - Glory Simon Interiors', 'Dear {clientName},\n\nWe are pleased to provide an update on the progress of your luxury interior installation at {location}.\n\nMilestone Status: {milestoneTitle} is now {milestoneStatus}.\nDetails: {updateDetails}\n\nThank you for your continued partnership.\n\nWarm regards,\nGlory Simon Interiors Team'),
('project_completion', 'Project Completion Email', 'Your Space is Ready! Glory Simon Interiors', 'Dear {clientName},\n\nCongratulations! We have completed all finishing touches, wood millwork, and final site snags on your {projectType} at {location}.\n\nOur team is preparing the handoff documents and keys for you.\n\nWe look forward to welcoming you into your new custom-designed home.\n\nWarmest regards,\nGlory Simon and Team')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body;

-- Create Storage Bucket for Client Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-documents', 'client-documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies for client-documents storage objects
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'client-documents');

DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;
CREATE POLICY "Allow all operations" ON storage.objects 
    FOR ALL USING (bucket_id = 'client-documents') WITH CHECK (bucket_id = 'client-documents');
