// Entity types per blueprint Section 9

export type EnquiryStatus = 'New' | 'Hot' | 'Warm' | 'Cold' | 'Converted' | 'Lost';
export type PipelineStage = 'New Enquiry' | 'Consultation' | 'Design Proposal' | 'Negotiation' | 'Won' | 'Lost';
export type ProjectType = 'Villa' | 'Penthouse' | 'Apartment' | 'Duplex' | 'Office' | 'Commercial' | 'Retail' | 'Farmhouse';
export type LeadSource = 'Referral' | 'Instagram' | 'Website' | 'Walk-in' | 'LinkedIn' | 'Other';

export interface Enquiry {
  id: string;
  client_name: string;
  email?: string;
  phone?: string;
  location?: string;
  project_type?: ProjectType;
  budget_min?: number;
  budget_max?: number;
  source?: LeadSource;
  status: EnquiryStatus;
  pipeline_stage: PipelineStage;
  assigned_to?: string;
  notes?: string;
  created_date: string;
}

export type VisitType = 'Initial Survey' | 'Progress Review' | 'Final Walkthrough' | 'Design Presentation' | 'Material Selection';
export type VisitStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface SiteVisit {
  id: string;
  client_name: string;
  enquiry_id?: string;
  location?: string;
  visit_date: string;
  visit_time: string;
  engineer_id?: string;
  visit_type?: VisitType;
  status: VisitStatus;
  notes?: string;
  created_date: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Approved' | 'Revised' | 'Rejected';

export interface LineItem {
  category: string;
  item_name: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface Quotation {
  id: string;
  quote_number: string;
  client_name: string;
  project_name: string;
  enquiry_id?: string;
  assigned_to?: string;
  status: QuotationStatus;
  line_items: LineItem[];
  subtotal: number;
  design_fee_pct: number;
  gst_pct: number;
  grand_total: number;
  notes?: string;
  created_date: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  enquiry_id?: string;
  client_name: string;
  sender_id?: string;
  direction: MessageDirection;
  content: string;
  status: MessageStatus;
  created_date: string;
}

export type ProjectStatus = 'Design Phase' | 'In Progress' | 'Procurement' | 'Site Work' | 'Completed' | 'On Hold';

export interface Milestone {
  name: string;
  due_date: string;
  completed: boolean;
}

export interface ProcurementItem {
  item: string;
  vendor: string;
  status: 'Delivered' | 'In Transit' | 'Ordered' | 'Delayed' | 'Quoted';
  eta: string;
  amount: number;
}

export interface Project {
  id: string;
  name: string;
  client_name: string;
  enquiry_id?: string;
  location?: string;
  value: number;
  status: ProjectStatus;
  progress: number;
  team_members: string[];
  milestones: Milestone[];
  procurement_items: ProcurementItem[];
  notes?: string;
  created_date: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_date: string;
}

export type EntityName = 'Enquiry' | 'SiteVisit' | 'Quotation' | 'Message' | 'Project' | 'User';
