export type UserRole = 
  | 'Admin' 
  | 'Project Manager' 
  | 'Interior Designer' 
  | 'Site Engineer' 
  | 'Client Relationship Manager' 
  | 'Procurement Coordinator' 
  | 'Vendor Manager';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  roleTitle?: string;
  specialization?: string;
  yearsExperience?: number;
  bio?: string;
  profileImage?: string;
  projectsCompleted?: number;
}

export type ProjectType = 
  | 'Home Interior' 
  | 'Office Interior' 
  | 'Commercial Interior';

export type PreferredStyle = 
  | 'Modern' 
  | 'Luxury' 
  | 'Contemporary' 
  | 'Minimalist' 
  | 'Traditional';

export type LeadSource = 
  | 'Website' 
  | 'WhatsApp' 
  | 'Instagram' 
  | 'Facebook' 
  | 'Referral' 
  | 'Walk-In';

export type LeadPriority = 
  | 'Low' 
  | 'Medium' 
  | 'High' 
  | 'Urgent';

export type LeadStatus = 
  | 'New Lead' 
  | 'Follow Up' 
  | 'Site Visit Scheduled' 
  | 'Quotation Sent' 
  | 'Negotiation' 
  | 'Confirmed' 
  | 'Lost';

export interface Enquiry {
  id: string;
  clientName: string;
  phoneNumber: string;
  email: string;
  companyName: string;
  projectType: ProjectType;
  location: string;
  budget: number;
  sqFtArea: number;
  preferredStyle: PreferredStyle;
  requirements: string;
  notes: string;
  leadSource: LeadSource;
  priority: LeadPriority;
  status: LeadStatus;
  assignedStaffId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  enquiryId: string;
  oldStatus: LeadStatus | null;
  newStatus: LeadStatus;
  changedById: string;
  notes?: string;
  createdAt: string;
}

export type VisitStatus = 
  | 'Scheduled' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Rescheduled';

export interface SiteVisit {
  id: string;
  enquiryId: string;
  scheduledAt: string;
  status: VisitStatus;
  engineerId: string; // references UserProfile
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus = 
  | 'Draft' 
  | 'Sent' 
  | 'Approved' 
  | 'Rejected';

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  enquiryId: string;
  amount: number;
  status: QuotationStatus;
  items: QuotationItem[];
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  consultantId?: string;
}

export type CommunicationType = 'WhatsApp' | 'Email';
export type CommunicationDirection = 'Inbound' | 'Outbound';
export type CommunicationStatus = 'Sent' | 'Delivered' | 'Failed';

export interface CommunicationLog {
  id: string;
  enquiryId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  templateName?: string;
  content: string;
  status: CommunicationStatus;
  sentById: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AiLog {
  id: string;
  enquiryId: string;
  promptType: 'summarizer' | 'follow_up' | 'scoring' | 'suggestions';
  response: Record<string, any>;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  enquiryId?: string;
}

export interface EmailLog {
  id: string;
  enquiryId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  emailType: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  messageId?: string;
  errorMessage?: string;
  attachments?: { name: string; url: string }[];
  sentAt: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientStatus = 'Active' | 'Inactive' | 'Lead' | 'Archived';

export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


