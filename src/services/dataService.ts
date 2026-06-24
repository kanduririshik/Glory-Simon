import { SupabaseCRMService } from './supabaseService';
import type { 
  UserProfile, 
  Enquiry, 
  StatusHistory, 
  SiteVisit, 
  Quotation, 
  CommunicationLog, 
  AppNotification, 
  AiLog,
  EmailLog,
  EmailTemplate
} from '../types';

// ==========================================
// SERVICE INTERFACE DEFINITION (Repository Pattern)
// ==========================================
export interface ICRMService {
  // Auth
  getCurrentUser(): Promise<UserProfile>;
  getProfiles(): Promise<UserProfile[]>;
  createProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<UserProfile>;
  updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  deleteProfile(id: string): Promise<boolean>;
  
  // Enquiries
  getEnquiries(): Promise<Enquiry[]>;
  getEnquiry(id: string): Promise<Enquiry | undefined>;
  createEnquiry(enquiry: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Enquiry>;
  updateEnquiry(id: string, updates: Partial<Enquiry>): Promise<Enquiry>;
  deleteEnquiry(id: string): Promise<boolean>;
  
  // Status History
  getStatusHistory(enquiryId: string): Promise<StatusHistory[]>;
  
  // Site Visits
  getSiteVisits(enquiryId?: string): Promise<SiteVisit[]>;
  createSiteVisit(visit: Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt'>): Promise<SiteVisit>;
  updateSiteVisit(id: string, updates: Partial<SiteVisit>): Promise<SiteVisit>;
  
  // Quotations
  getQuotations(enquiryId?: string): Promise<Quotation[]>;
  createQuotation(quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Promise<Quotation>;
  updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation>;
  
  // Communications
  getCommunications(enquiryId: string): Promise<CommunicationLog[]>;
  logCommunication(log: Omit<CommunicationLog, 'id' | 'createdAt'>): Promise<CommunicationLog>;
  
  // Email logs & templates
  getEmailLogs(enquiryId?: string): Promise<EmailLog[]>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
  sendEmail(params: {
    enquiryId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    emailType: string;
    attachments?: { name: string; url?: string; base64?: string; mimeType?: string }[];
  }): Promise<{ success: boolean; messageId?: string; errorMessage?: string }>;
  uploadDocument(fileName: string, fileBlob: Blob): Promise<string>;

  // Notifications
  getNotifications(): Promise<AppNotification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  clearAllNotifications(): Promise<void>;
  
  // AI Services
  getAiLogs(enquiryId: string): Promise<AiLog[]>;
  generateAiResponse(enquiryId: string, promptType: AiLog['promptType']): Promise<AiLog>;
  
  // Realtime subscription helper
  subscribe(callback: () => void): () => void;
}

// Export the active service — Supabase PostgreSQL
// To revert to mock: import MockCRMService from mockRepository and swap below.
export const api = new SupabaseCRMService();
export default api;
