/**
 * Glory Simon Interiors — Supabase CRM Service
 *
 * Drop-in replacement for MockCRMService.
 * Implements the exact same ICRMService interface defined in dataService.ts.
 * The rest of the app (CRMContext, NotificationContext, all pages) is untouched.
 *
 * Column mapping:  Supabase (snake_case) ↔ TypeScript (camelCase)
 * Realtime:       Uses Supabase Realtime channels instead of localStorage listeners
 */

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ICRMService } from './dataService';
import { emailProviderService } from './emailProvider';
import { buildEnterpriseEmailHtml, replacePlaceholders } from './emailFormatter';
import { formatCurrencyINR } from '../utils/format';
import type {
  UserProfile,
  Enquiry,
  StatusHistory,
  SiteVisit,
  Quotation,
  CommunicationLog,
  AppNotification,
  AiLog,
  LeadStatus,
  EmailLog,
  EmailTemplate,
} from '../types';

// ─────────────────────────────────────────────────────────────
// Row-shape types returned by Supabase (snake_case columns)
// ─────────────────────────────────────────────────────────────
interface UserProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  role_title: string | null;
  specialization: string | null;
  years_experience: number | null;
  bio: string | null;
  profile_image: string | null;
  projects_completed: number | null;
}

interface EnquiryRow {
  id: string;
  client_name: string;
  phone_number: string;
  email: string;
  company_name: string;
  project_type: string;
  location: string;
  budget: number;
  sq_ft_area: number;
  preferred_style: string;
  requirements: string;
  notes: string;
  lead_source: string;
  priority: string;
  status: string;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

interface StatusHistoryRow {
  id: string;
  enquiry_id: string;
  old_status: string | null;
  new_status: string;
  changed_by_id: string | null;
  notes: string | null;
  created_at: string;
}

interface SiteVisitRow {
  id: string;
  enquiry_id: string;
  scheduled_at: string;
  status: string;
  engineer_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface QuotationRow {
  id: string;
  quotation_number: string;
  enquiry_id: string;
  amount: number;
  status: string;
  items: unknown; // JSONB
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  consultant_id: string | null;
}

interface CommunicationLogRow {
  id: string;
  enquiry_id: string;
  type: string;
  direction: string;
  template_name: string | null;
  content: string;
  status: string;
  sent_by_id: string | null;
  error_message: string | null;
  created_at: string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  enquiry_id: string | null;
  created_at: string;
}

interface AiLogRow {
  id: string;
  enquiry_id: string;
  prompt_type: string;
  response: unknown;
  created_at: string;
}

interface EmailLogRow {
  id: string;
  enquiry_id: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  email_type: string;
  status: string;
  message_id: string | null;
  error_message: string | null;
  attachments: unknown;
  sent_at: string;
  created_at: string;
}

interface EmailTemplateRow {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Mappers: Supabase row → TypeScript domain type
// ─────────────────────────────────────────────────────────────
const mapProfile = (r: UserProfileRow): UserProfile => ({
  id: r.id,
  fullName: r.full_name,
  email: r.email,
  role: r.role as UserProfile['role'],
  avatarUrl: r.avatar_url ?? undefined,
  createdAt: r.created_at,
  roleTitle: r.role_title ?? undefined,
  specialization: r.specialization ?? undefined,
  yearsExperience: r.years_experience ?? undefined,
  bio: r.bio ?? undefined,
  profileImage: r.profile_image ?? undefined,
  projectsCompleted: r.projects_completed ?? undefined,
});

const mapEnquiry = (r: EnquiryRow): Enquiry => ({
  id: r.id,
  clientName: r.client_name,
  phoneNumber: r.phone_number,
  email: r.email,
  companyName: r.company_name,
  projectType: r.project_type as Enquiry['projectType'],
  location: r.location,
  budget: r.budget,
  sqFtArea: r.sq_ft_area,
  preferredStyle: r.preferred_style as Enquiry['preferredStyle'],
  requirements: r.requirements,
  notes: r.notes,
  leadSource: r.lead_source as Enquiry['leadSource'],
  priority: r.priority as Enquiry['priority'],
  status: r.status as LeadStatus,
  assignedStaffId: r.assigned_staff_id ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapStatusHistory = (r: StatusHistoryRow): StatusHistory => ({
  id: r.id,
  enquiryId: r.enquiry_id,
  oldStatus: (r.old_status as LeadStatus) ?? null,
  newStatus: r.new_status as LeadStatus,
  changedById: r.changed_by_id ?? '',
  notes: r.notes ?? undefined,
  createdAt: r.created_at,
});

const mapSiteVisit = (r: SiteVisitRow): SiteVisit => ({
  id: r.id,
  enquiryId: r.enquiry_id,
  scheduledAt: r.scheduled_at,
  status: r.status as SiteVisit['status'],
  engineerId: r.engineer_id ?? '',
  notes: r.notes ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapQuotation = (r: QuotationRow): Quotation => ({
  id: r.id,
  quotationNumber: r.quotation_number,
  enquiryId: r.enquiry_id,
  amount: r.amount,
  status: r.status as Quotation['status'],
  items: (r.items as Quotation['items']) ?? [],
  sentAt: r.sent_at ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  consultantId: r.consultant_id ?? undefined,
});

const mapCommunicationLog = (r: CommunicationLogRow): CommunicationLog => ({
  id: r.id,
  enquiryId: r.enquiry_id,
  type: r.type as CommunicationLog['type'],
  direction: r.direction as CommunicationLog['direction'],
  templateName: r.template_name ?? undefined,
  content: r.content,
  status: r.status as CommunicationLog['status'],
  sentById: r.sent_by_id ?? '',
  errorMessage: r.error_message ?? undefined,
  createdAt: r.created_at,
});

const mapNotification = (r: NotificationRow): AppNotification => ({
  id: r.id,
  title: r.title,
  message: r.message,
  type: r.type as AppNotification['type'],
  read: r.read,
  enquiryId: r.enquiry_id ?? undefined,
  createdAt: r.created_at,
});

const mapAiLog = (r: AiLogRow): AiLog => ({
  id: r.id,
  enquiryId: r.enquiry_id,
  promptType: r.prompt_type as AiLog['promptType'],
  response: r.response as Record<string, unknown>,
  createdAt: r.created_at,
});

const mapEmailLog = (r: EmailLogRow): EmailLog => {
  let parsedAttachments: EmailLog['attachments'] = [];
  if (r.attachments) {
    if (typeof r.attachments === 'string') {
      try {
        parsedAttachments = JSON.parse(r.attachments);
      } catch (e) {
        console.error('Failed to parse attachments:', e);
      }
    } else if (Array.isArray(r.attachments)) {
      parsedAttachments = r.attachments as EmailLog['attachments'];
    }
  }

  return {
    id: r.id,
    enquiryId: r.enquiry_id ?? undefined,
    recipientEmail: r.recipient_email,
    subject: r.subject,
    body: r.body,
    emailType: r.email_type,
    status: r.status as EmailLog['status'],
    messageId: r.message_id ?? undefined,
    errorMessage: r.error_message ?? undefined,
    attachments: parsedAttachments,
    sentAt: r.sent_at,
    createdAt: r.created_at,
  };
};

const mapEmailTemplate = (r: EmailTemplateRow): EmailTemplate => ({
  id: r.id,
  name: r.name,
  subject: r.subject,
  body: r.body,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// ─────────────────────────────────────────────────────────────
// Helper: throw a readable error from a Supabase response or gracefully fallback
// ─────────────────────────────────────────────────────────────
function assertOk<T>(
  data: T | null,
  error: { message: string; code?: string; details?: string; hint?: string } | null,
  context: string,
  fallback?: T
): T {
  console.log(`[Supabase] EXECUTING QUERY: ${context}`);

  if (error) {
    console.error(`[Supabase] QUERY FAILED: ${context}`);
    console.error(`    ↳ Message: ${error.message}`);
    if (error.code) console.error(`    ↳ Code: ${error.code}`);
    if (error.details) console.error(`    ↳ Details: ${error.details}`);
    if (error.hint) console.error(`    ↳ Hint: ${error.hint}`);
    
    if (fallback !== undefined) {
      console.warn(`[Supabase] Recovering gracefully for ${context} with empty fallback.`);
      return fallback;
    }
    throw new Error(`[Supabase] ${context}: ${error.message}`);
  }
  
  const count = Array.isArray(data) ? data.length : (data === null ? 0 : 1);
  console.log(`[Supabase] QUERY SUCCESS: ${context} returned ${count} records.`);
  
  if (data === null) {
    if (fallback !== undefined) return fallback;
    console.error(`[Supabase] ERROR in ${context}: no data returned`);
    throw new Error(`[Supabase] ${context}: no data returned`);
  }
  return data;
}



// ─────────────────────────────────────────────────────────────
// AI response generator — kept in-memory (compute, not storage)
// ─────────────────────────────────────────────────────────────
function generateAiResponseContent(
  enquiry: Enquiry,
  promptType: AiLog['promptType']
): Record<string, unknown> {
  switch (promptType) {
    case 'summarizer':
      return {
        summary: `The client, **${enquiry.clientName}** of ${enquiry.companyName || 'Private Residence'}, is seeking a bespoke **${enquiry.projectType}** at their **${enquiry.location}** property.`,
        keyDemands: [
          enquiry.requirements || 'No custom requirement description provided.',
          `Prefers a **${enquiry.preferredStyle}** luxury theme.`,
          `Budget envelope is set to **${formatCurrencyINR(enquiry.budget)}** covering **${enquiry.sqFtArea.toLocaleString()} sq ft**.`,
        ],
        criticalConcerns: [
          'Staff assignment and designer scheduling.',
          'Precision matching of material qualities to budget parameters.',
        ],
      };

    case 'follow_up':
      return {
        welcome: `Dear ${enquiry.clientName},\n\nThank you for choosing Glory Simon Interiors. We are thrilled to review your request for the design of your ${enquiry.projectType} at ${enquiry.location}.\n\nWarmly,\nGlory Simon Interiors Team`,
        visitReminder: `Hi ${enquiry.clientName}, this is a gentle reminder regarding our site visit scheduled for your property.`,
        quoteReminder: `Dear ${enquiry.clientName},\n\nWe hope you had a chance to review our detailed cost quotation.\n\nBest regards,\nSarah Jenkins`,
        projectConfirm: `Dear ${enquiry.clientName},\n\nIt is official! Welcome to the Glory Simon Interiors design family.\n\nWarmest regards,\nGlory Simon`,
      };

    case 'scoring': {
      const score = enquiry.budget > 500000 ? 95 : enquiry.budget > 250000 ? 82 : 65;
      const probability =
        enquiry.status === 'Negotiation' ? 0.85
        : enquiry.status === 'Quotation Sent' ? 0.70
        : enquiry.status === 'Site Visit Scheduled' ? 0.50
        : 0.25;
      return {
        leadScore: score,
        conversionProbability: probability * 100,
        scoreBreakdown: {
          budgetRating: enquiry.budget >= 500000 ? 'Elite Tier' : 'Mid Tier',
          styleInterest: 'Highly responsive to premium portfolios',
          locationFeasibility: 'Within high-density luxury zoning area',
        },
        recommendedNextAction:
          enquiry.status === 'New Lead' ? 'Assign senior designer and trigger intro call'
          : enquiry.status === 'Follow Up' ? 'Schedule on-site dimensions review'
          : enquiry.status === 'Site Visit Scheduled' ? 'Prepare interior design layout and quotation draft'
          : enquiry.status === 'Quotation Sent' ? 'Set up showroom presentation with material samples'
          : enquiry.status === 'Negotiation' ? 'Offer 5% adjustments on vendor sourcing fees'
          : 'Commence blueprints drafting',
      };
    }

    case 'suggestions': {
      const luxDesignStyles = ['Modern Neoclassical', 'Gilded Art Deco', 'Rich Transitional'];
      const luxMaterials = ['Calacatta Gold Marble', 'Brushed Brass Metalwork', 'Velvet & Bouclé Upholstery', 'Smoked Oak Veneers'];
      const luxTips = ['Allocate 35% of budget to custom built-in joinery', 'Source marbles direct from Carrara quarries to cut distributor margins by 20%'];

      const minDesignStyles = ['Japandi (Japanese + Scandinavian)', 'Raw Industrial Minimalism', 'Warm Minimalist'];
      const minMaterials = ['Polished Microcement', 'Natural Raw Linen', 'Unfinished Ash Wood', 'Matte Black Steel'];
      const minTips = ['Invest in seamless hidden flush doors', 'Reduce decorative molding expenses and focus on premium architectural task-lighting'];

      const defaultDesignStyles = ['Contemporary Organic', 'Biophilic Luxe', 'Earthy Modern'];
      const defaultMaterials = ['Travertine Stone', 'Bouclé fabrics', 'Fluted timber sheets', 'Eco-engineered quartz'];
      const defaultTips = ['Utilize local materials for organic accents', 'Focus lighting budget on dynamic smart scenes'];

      const designStyles = enquiry.preferredStyle === 'Luxury' ? luxDesignStyles : enquiry.preferredStyle === 'Minimalist' ? minDesignStyles : defaultDesignStyles;
      const materials = enquiry.preferredStyle === 'Luxury' ? luxMaterials : enquiry.preferredStyle === 'Minimalist' ? minMaterials : defaultMaterials;
      const costTips = enquiry.preferredStyle === 'Luxury' ? luxTips : enquiry.preferredStyle === 'Minimalist' ? minTips : defaultTips;

      return {
        suggestedSubStyles: designStyles,
        recommendedMaterials: materials,
        budgetAllocations: costTips,
      };
    }

    default:
      return {};
  }
}

// ─────────────────────────────────────────────────────────────
// SupabaseCRMService — implements ICRMService
// ─────────────────────────────────────────────────────────────
export class SupabaseCRMService implements ICRMService {
  private channel: RealtimeChannel | null = null;
  private listeners: Set<() => void> = new Set();

  // ── Auth ──────────────────────────────────────────────────

  async getCurrentUser(): Promise<UserProfile> {
    // Single admin: always run as Glory Simon (role: 'Admin')
    return {
      id: 'p1',
      fullName: 'Glory Simon',
      email: 'glory@glorysimon.com',
      role: 'Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60',
      createdAt: '2025-01-01T00:00:00Z',
    };
  }

  async getProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
    return assertOk(data, error, 'getProfiles', [] as unknown as UserProfileRow[]).map((r: any) => mapProfile(r as UserProfileRow));
  }

  async createProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<UserProfile> {
    const row = {
      id: profile.id || undefined,
      full_name: profile.fullName,
      email: profile.email,
      role: profile.role,
      avatar_url: profile.avatarUrl || null,
    };
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(row)
      .select()
      .single();
    return mapProfile(assertOk(data, error, 'createProfile') as UserProfileRow);
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const row: Record<string, any> = {};
    if (updates.fullName !== undefined) row.full_name = updates.fullName;
    if (updates.email !== undefined)    row.email     = updates.email;
    if (updates.role !== undefined)     row.role      = updates.role;
    if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl || null;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    return mapProfile(assertOk(data, error, 'updateProfile') as UserProfileRow);
  }

  async deleteProfile(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`[Supabase] deleteProfile: ${error.message}`);
    return true;
  }

  // ── Enquiries ─────────────────────────────────────────────

  async getEnquiries(): Promise<Enquiry[]> {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    return assertOk(data, error, 'getEnquiries', [] as unknown as EnquiryRow[]).map((r: any) => mapEnquiry(r as EnquiryRow));
  }

  async getEnquiry(id: string): Promise<Enquiry | undefined> {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`[Supabase] getEnquiry: ${error.message}`);
    return data ? mapEnquiry(data as EnquiryRow) : undefined;
  }

  async createEnquiry(
    enquiryInput: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Enquiry> {
    const row = {
      client_name: enquiryInput.clientName,
      phone_number: enquiryInput.phoneNumber,
      email: enquiryInput.email,
      company_name: enquiryInput.companyName,
      project_type: enquiryInput.projectType,
      location: enquiryInput.location,
      budget: enquiryInput.budget,
      sq_ft_area: enquiryInput.sqFtArea,
      preferred_style: enquiryInput.preferredStyle,
      requirements: enquiryInput.requirements,
      notes: enquiryInput.notes,
      lead_source: enquiryInput.leadSource,
      priority: enquiryInput.priority,
      status: enquiryInput.status,
      assigned_staff_id: enquiryInput.assignedStaffId ?? null,
    };

    const { data, error } = await supabase
      .from('enquiries')
      .insert(row)
      .select()
      .single();
    const enquiry = mapEnquiry(assertOk(data, error, 'createEnquiry') as EnquiryRow);

    // Initial status history entry
    await this._createStatusHistory(enquiry.id, null, enquiry.status, 'Lead registered in CRM.');

    // Notification
    await this._createNotification(
      'New Enquiry Registered',
      `${enquiry.clientName} created a new project enquiry for ${enquiry.location || 'unspecified location'}.`,
      'info',
      enquiry.id
    );

    this._notify();
    return enquiry;
  }

  async updateEnquiry(id: string, updates: Partial<Enquiry>): Promise<Enquiry> {
    // Fetch current state to detect status change
    const current = await this.getEnquiry(id);
    if (!current) throw new Error(`Enquiry ${id} not found.`);

    const row: Record<string, unknown> = {};
    if (updates.clientName !== undefined)    row.client_name      = updates.clientName;
    if (updates.phoneNumber !== undefined)   row.phone_number     = updates.phoneNumber;
    if (updates.email !== undefined)         row.email            = updates.email;
    if (updates.companyName !== undefined)   row.company_name     = updates.companyName;
    if (updates.projectType !== undefined)   row.project_type     = updates.projectType;
    if (updates.location !== undefined)      row.location         = updates.location;
    if (updates.budget !== undefined)        row.budget           = updates.budget;
    if (updates.sqFtArea !== undefined)      row.sq_ft_area       = updates.sqFtArea;
    if (updates.preferredStyle !== undefined) row.preferred_style = updates.preferredStyle;
    if (updates.requirements !== undefined)  row.requirements     = updates.requirements;
    if (updates.notes !== undefined)         row.notes            = updates.notes;
    if (updates.leadSource !== undefined)    row.lead_source      = updates.leadSource;
    if (updates.priority !== undefined)      row.priority         = updates.priority;
    if (updates.status !== undefined)        row.status           = updates.status;
    if (updates.assignedStaffId !== undefined) row.assigned_staff_id = updates.assignedStaffId ?? null;

    const { data, error } = await supabase
      .from('enquiries')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    const enquiry = mapEnquiry(assertOk(data, error, 'updateEnquiry') as EnquiryRow);

    // Status transition tracking
    if (updates.status && updates.status !== current.status) {
      await this._createStatusHistory(
        id,
        current.status,
        updates.status,
        updates.notes || `Moved lead from ${current.status} to ${updates.status}.`
      );

      await this._createNotification(
        'Lead Status Promoted',
        `${enquiry.clientName} has been transitioned to ${updates.status}.`,
        updates.status === 'Confirmed' ? 'success' : 'info',
        id
      );
    }

    this._notify();
    return enquiry;
  }

  async deleteEnquiry(id: string): Promise<boolean> {
    // Cascade deletes status_history, site_visits, quotations, communications, notifications
    const { error } = await supabase
      .from('enquiries')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`[Supabase] deleteEnquiry: ${error.message}`);
    this._notify();
    return true;
  }

  // ── Status History ────────────────────────────────────────

  async getStatusHistory(enquiryId: string): Promise<StatusHistory[]> {
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('enquiry_id', enquiryId);
    return assertOk(data, error, 'getStatusHistory', [] as unknown as StatusHistoryRow[]).map((r: any) => mapStatusHistory(r as StatusHistoryRow));
  }

  private async _createStatusHistory(
    enquiryId: string,
    oldStatus: LeadStatus | null,
    newStatus: LeadStatus,
    notes?: string
  ): Promise<void> {
    const currentUser = await this.getCurrentUser();
    await supabase.from('status_history').insert({
      enquiry_id: enquiryId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by_id: currentUser.id,
      notes: notes ?? null,
    });
  }

  // ── Site Visits ───────────────────────────────────────────

  async getSiteVisits(enquiryId?: string): Promise<SiteVisit[]> {
    let query = supabase
      .from('site_visits')
      .select('*');
    if (enquiryId) query = query.eq('enquiry_id', enquiryId);
    const { data, error } = await query;
    return assertOk(data, error, 'getSiteVisits', [] as unknown as SiteVisitRow[]).map((r: any) => mapSiteVisit(r as SiteVisitRow));
  }

  async createSiteVisit(
    visitInput: Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SiteVisit> {
    const { data, error } = await supabase
      .from('site_visits')
      .insert({
        enquiry_id: visitInput.enquiryId,
        scheduled_at: visitInput.scheduledAt,
        status: visitInput.status,
        engineer_id: visitInput.engineerId || null,
        notes: visitInput.notes ?? null,
      })
      .select()
      .single();
    const visit = mapSiteVisit(assertOk(data, error, 'createSiteVisit') as SiteVisitRow);

    // Auto-promote enquiry status if still early stage
    const enquiry = await this.getEnquiry(visitInput.enquiryId);
    if (enquiry && (enquiry.status === 'New Lead' || enquiry.status === 'Follow Up')) {
      await this.updateEnquiry(enquiry.id, { status: 'Site Visit Scheduled' });
    }

    // Notification
    if (enquiry) {
      await this._createNotification(
        'Site Visit Scheduled',
        `Site Engineer assigned to visit ${enquiry.clientName} at ${new Date(visitInput.scheduledAt).toLocaleString()}.`,
        'warning',
        enquiry.id
      );
    }

    this._notify();
    return visit;
  }

  async updateSiteVisit(id: string, updates: Partial<SiteVisit>): Promise<SiteVisit> {
    const row: Record<string, unknown> = {};
    if (updates.scheduledAt !== undefined) row.scheduled_at = updates.scheduledAt;
    if (updates.status !== undefined)      row.status       = updates.status;
    if (updates.engineerId !== undefined)  row.engineer_id  = updates.engineerId || null;
    if (updates.notes !== undefined)       row.notes        = updates.notes ?? null;

    const { data, error } = await supabase
      .from('site_visits')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    const visit = mapSiteVisit(assertOk(data, error, 'updateSiteVisit') as SiteVisitRow);
    this._notify();
    return visit;
  }

  // ── Quotations ────────────────────────────────────────────

  async getQuotations(enquiryId?: string): Promise<Quotation[]> {
    let query = supabase
      .from('quotations')
      .select('*');
    if (enquiryId) query = query.eq('enquiry_id', enquiryId);
    const { data, error } = await query;
    return assertOk(data, error, 'getQuotations', [] as unknown as QuotationRow[]).map((r: any) => mapQuotation(r as QuotationRow));
  }

  async createQuotation(
    quotationInput: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Quotation> {
    // Generate sequential quotation number
    const { count } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true });
    const num = ((count ?? 0) + 1).toString().padStart(3, '0');
    const quotationNumber = `QT-${new Date().getFullYear()}-${num}`;

    const { data, error } = await supabase
      .from('quotations')
      .insert({
        quotation_number: quotationNumber,
        enquiry_id: quotationInput.enquiryId,
        amount: quotationInput.amount,
        status: quotationInput.status,
        items: quotationInput.items,
        sent_at: quotationInput.sentAt ?? null,
        consultant_id: quotationInput.consultantId ?? null,
      })
      .select()
      .single();
    const quotation = mapQuotation(assertOk(data, error, 'createQuotation') as QuotationRow);

    const enquiry = await this.getEnquiry(quotationInput.enquiryId);
    if (enquiry) {
      // Auto-promote enquiry status
      if (!['Confirmed', 'Lost', 'Negotiation'].includes(enquiry.status)) {
        await this.updateEnquiry(enquiry.id, { status: 'Quotation Sent' });
      }

      await this._createNotification(
        'Quotation Proposal Drafted',
        `New quote proposal ${quotationNumber} (${formatCurrencyINR(quotationInput.amount)}) created for ${enquiry.clientName}.`,
        'success',
        enquiry.id
      );
    }

    this._notify();
    return quotation;
  }

  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation> {
    const row: Record<string, unknown> = {};
    if (updates.amount !== undefined)   row.amount  = updates.amount;
    if (updates.status !== undefined)   row.status  = updates.status;
    if (updates.items !== undefined)    row.items   = updates.items;
    if (updates.sentAt !== undefined)   row.sent_at = updates.sentAt ?? null;
    if (updates.consultantId !== undefined) row.consultant_id = updates.consultantId ?? null;

    const { data, error } = await supabase
      .from('quotations')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    const quotation = mapQuotation(assertOk(data, error, 'updateQuotation') as QuotationRow);

    // Handle approval / rejection triggers
    const enquiry = await this.getEnquiry(quotation.enquiryId);
    if (enquiry) {
      if (updates.status === 'Approved') {
        await this.updateEnquiry(enquiry.id, { status: 'Confirmed' });
        await this._createNotification(
          'Quotation Approved!',
          `${enquiry.clientName} approved Quotation ${quotation.quotationNumber}. Project confirmed!`,
          'success',
          enquiry.id
        );
      } else if (updates.status === 'Rejected') {
        await this.updateEnquiry(enquiry.id, { status: 'Negotiation' });
        await this._createNotification(
          'Quotation Proposal Rejected',
          `${enquiry.clientName} requested revisions for Quotation ${quotation.quotationNumber}.`,
          'info',
          enquiry.id
        );
      }
    }

    this._notify();
    return quotation;
  }

  // ── Communications ────────────────────────────────────────

  async getCommunications(enquiryId: string): Promise<CommunicationLog[]> {
    const { data, error } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('enquiry_id', enquiryId);
    return assertOk(data, error, 'getCommunications', [] as unknown as CommunicationLogRow[]).map((r: any) => mapCommunicationLog(r as CommunicationLogRow));
  }

  async logCommunication(
    logInput: Omit<CommunicationLog, 'id' | 'createdAt'>
  ): Promise<CommunicationLog> {
    const { data, error } = await supabase
      .from('communication_logs')
      .insert({
        enquiry_id: logInput.enquiryId,
        type: logInput.type,
        direction: logInput.direction,
        template_name: logInput.templateName ?? null,
        content: logInput.content,
        status: logInput.status,
        sent_by_id: logInput.sentById || null,
        error_message: logInput.errorMessage ?? null,
      })
      .select()
      .single();
    const log = mapCommunicationLog(assertOk(data, error, 'logCommunication') as CommunicationLogRow);
    this._notify();
    return log;
  }

  // ── Notifications ─────────────────────────────────────────

  async getNotifications(): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*');
    return assertOk(data, error, 'getNotifications', [] as unknown as NotificationRow[]).map((r: any) => mapNotification(r as NotificationRow));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw new Error(`[Supabase] markNotificationAsRead: ${error.message}`);
    this._notify();
  }

  async clearAllNotifications(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows
    if (error) throw new Error(`[Supabase] clearAllNotifications: ${error.message}`);
    this._notify();
  }

  private async _createNotification(
    title: string,
    message: string,
    type: AppNotification['type'],
    enquiryId?: string
  ): Promise<void> {
    await supabase.from('notifications').insert({
      title,
      message,
      type,
      read: false,
      enquiry_id: enquiryId ?? null,
    });
  }

  // ── AI Logs ───────────────────────────────────────────────

  async getAiLogs(enquiryId: string): Promise<AiLog[]> {
    const { data, error } = await supabase
      .from('ai_logs')
      .select('*')
      .eq('enquiry_id', enquiryId);
    return assertOk(data, error, 'getAiLogs', [] as unknown as AiLogRow[]).map((r: any) => mapAiLog(r as AiLogRow));
  }

  async generateAiResponse(
    enquiryId: string,
    promptType: AiLog['promptType']
  ): Promise<AiLog> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    // Fetch the enquiry details from Supabase to send as context
    const enquiry = await this.getEnquiry(enquiryId);
    if (!enquiry) throw new Error('Enquiry not found');

    let responseContent: any;

    if (backendUrl) {
      try {
        let endpoint = '';
        if (promptType === 'summarizer') endpoint = '/api/ai_director/summarize';
        else if (promptType === 'scoring') endpoint = '/api/ai_director/score';
        else if (promptType === 'suggestions') endpoint = '/api/ai_director/suggestions';
        else if (promptType === 'follow_up') endpoint = '/api/ai_director/follow_up_crm';

        const res = await fetch(`${backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ client_info: enquiry })
        });
        
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API error (${res.status}): ${errText}`);
        }
        
        responseContent = await res.json();
      } catch (err) {
        console.error('[Supabase CRM] Render Backend API call failed, falling back to mock:', err);
        responseContent = generateAiResponseContent(enquiry, promptType);
      }
    } else {
      // Simulate premium thinking latency (kept for UX parity)
      await new Promise(resolve => setTimeout(resolve, 1500));
      responseContent = generateAiResponseContent(enquiry, promptType);
    }

    const { data, error } = await supabase
      .from('ai_logs')
      .insert({
        enquiry_id: enquiryId,
        prompt_type: promptType,
        response: responseContent,
      })
      .select()
      .single();

    return mapAiLog(assertOk(data, error, 'generateAiResponse') as AiLogRow);
  }

  // ── Email Logs & Templates ──────────────────────────────────

  async getEmailLogs(enquiryId?: string): Promise<EmailLog[]> {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });
    
    if (enquiryId) {
      query = query.eq('enquiry_id', enquiryId);
    }
    
    const { data, error } = await query;
    return assertOk(data, error, 'getEmailLogs', [] as unknown as EmailLogRow[]).map((r: any) => mapEmailLog(r as EmailLogRow));
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('id', { ascending: true });
    return assertOk(data, error, 'getEmailTemplates', [] as unknown as EmailTemplateRow[]).map((r: any) => mapEmailTemplate(r as EmailTemplateRow));
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const row: Record<string, any> = {};
    if (updates.subject !== undefined) row.subject = updates.subject;
    if (updates.body !== undefined) row.body = updates.body;
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('email_templates')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    
    const template = mapEmailTemplate(assertOk(data, error, 'updateEmailTemplate') as EmailTemplateRow);
    this._notify();
    return template;
  }

  async sendEmail(params: {
    enquiryId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    emailType: string;
    attachments?: { name: string; url?: string; base64?: string; mimeType?: string }[];
  }): Promise<{ success: boolean; messageId?: string; errorMessage?: string }> {
    let enquiry: Enquiry | undefined = undefined;
    let quotation: Quotation | undefined = undefined;
    let siteVisit: SiteVisit | undefined = undefined;
    let assignedStaff: UserProfile | undefined = undefined;
    let assignedEngineer: UserProfile | undefined = undefined;
    let allProfiles: UserProfile[] = [];

    const isTestEmail = params.enquiryId === '00000000-0000-0000-0000-000000000000';

    try {
      // 1. Fetch all user profiles for team directory
      const { data: pData } = await supabase
        .from('user_profiles')
        .select('*');
      if (pData) {
        allProfiles = pData.map((r: any) => mapProfile(r as UserProfileRow));
      }

      if (isTestEmail) {
        // Build robust simulated fallback variables for setting verification / dry-runs
        enquiry = {
          id: 'e6_demo',
          clientName: 'Sai Prasad',
          email: params.recipientEmail || 'saiprasadmeka22@gmail.com',
          phoneNumber: '+91 99887 76655',
          companyName: 'Private Residence',
          projectType: 'Home Interior',
          location: 'Hyderabad',
          budget: 500000,
          sqFtArea: 4500,
          preferredStyle: 'Luxury',
          requirements: 'Full residential makeover with custom Calacatta Gold marble flooring & bespoke oak joinery.',
          notes: 'High priority premium site',
          leadSource: 'Referral',
          priority: 'High',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        quotation = {
          id: 'q6_demo',
          quotationNumber: 'QT-2026-006',
          enquiryId: 'e6_demo',
          amount: 454000,
          status: 'Approved',
          items: [
            { id: 'qi1', description: 'Design layout & space blueprints', quantity: 1, unitPrice: 50000, amount: 50000 },
            { id: 'qi2', description: 'Calacatta Gold Marble Flooring', quantity: 420, unitPrice: 800, amount: 336000 },
            { id: 'qi3', description: 'Bespoke Oak Cabinetry & Joinery', quantity: 1, unitPrice: 68000, amount: 68000 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        siteVisit = {
          id: 'v6_demo',
          enquiryId: 'e6_demo',
          scheduledAt: '2026-06-25T10:30:00Z',
          status: 'Scheduled',
          engineerId: 'p3_demo',
          notes: 'Hyderabad Site Dimensions Verification & Lighting Check',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        assignedStaff = allProfiles.find(p => p.role === 'Interior Designer') || {
          id: 'p2_demo',
          fullName: 'John Matthew',
          email: 'john@glorysimon.com',
          role: 'Interior Designer',
          createdAt: new Date().toISOString()
        };

        assignedEngineer = allProfiles.find(p => p.role === 'Site Engineer') || {
          id: 'p3_demo',
          fullName: 'Rahul Sharma',
          email: 'rahul@glorysimon.com',
          role: 'Site Engineer',
          createdAt: new Date().toISOString()
        };
      } else {
        // Resolve actual database records
        if (params.enquiryId) {
          const { data: eData } = await supabase
            .from('enquiries')
            .select('*')
            .eq('id', params.enquiryId)
            .maybeSingle();
          if (eData) {
            enquiry = mapEnquiry(eData as EnquiryRow);
          }
        }

        const staffId = enquiry?.assignedStaffId;
        if (staffId) {
          assignedStaff = allProfiles.find(p => p.id === staffId);
        }

        // Retrieve latest quotation
        if (params.enquiryId) {
          const { data: qData } = await supabase
            .from('quotations')
            .select('*')
            .eq('enquiry_id', params.enquiryId)
            .order('created_at', { ascending: false })
            .limit(1);
          if (qData && qData.length > 0) {
            quotation = mapQuotation(qData[0] as QuotationRow);
          }
        }

        // Retrieve latest site visit
        if (params.enquiryId) {
          const { data: vData } = await supabase
            .from('site_visits')
            .select('*')
            .eq('enquiry_id', params.enquiryId)
            .order('scheduled_at', { ascending: false })
            .limit(1);
          if (vData && vData.length > 0) {
            siteVisit = mapSiteVisit(vData[0] as SiteVisitRow);
            const engId = siteVisit?.engineerId;
            if (engId) {
              assignedEngineer = allProfiles.find(p => p.id === engId);
            }
          }
        }
      }
    } catch (dbErr) {
      console.error('[SupabaseCRMService] DB fetch failed during sendEmail resolution:', dbErr);
    }

    // Compile render context
    const context = {
      enquiry,
      quotation,
      siteVisit,
      assignedStaff,
      assignedEngineer,
      allProfiles,
      attachments: params.attachments ? params.attachments.map(a => ({ name: a.name, url: a.url })) : []
    };

    // Format subject and compile final HTML
    const resolvedSubject = replacePlaceholders(params.subject, context);
    const resolvedHtmlBody = buildEnterpriseEmailHtml(params.body, context, params.emailType);

    // Call actual mail provider service with formatted details
    const result = await emailProviderService.sendEmail({
      ...params,
      subject: resolvedSubject,
      body: resolvedHtmlBody
    });

    this._notify();
    return result;
  }

  async uploadDocument(fileName: string, fileBlob: Blob): Promise<string> {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${Date.now()}_${sanitizedName}`;
    const { data, error } = await supabase.storage
      .from('client-documents')
      .upload(path, fileBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('[Supabase Storage] Upload failed:', error);
      throw new Error(`Document upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('client-documents')
      .getPublicUrl(data.path);
    
    return publicUrlData.publicUrl;
  }

  // ── Realtime ──────────────────────────────────────────────

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);

    // Set up a single shared Supabase Realtime channel
    if (!this.channel && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      try {
        this.channel = supabase
          .channel('glory_crm_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => this._notify())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'site_visits' }, () => this._notify())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, () => this._notify())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => this._notify())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'communication_logs' }, () => this._notify())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'email_logs' }, () => this._notify())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'email_templates' }, () => this._notify())
          .subscribe((status: any, err: any) => {
            if (status === 'SUBSCRIBED') {
              console.log('SUPABASE REALTIME: Successfully subscribed to database changes.');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('SUPABASE REALTIME ERROR:', err);
            } else if (status === 'TIMED_OUT') {
              console.error('SUPABASE REALTIME TIMEOUT:', err);
            } else if (status === 'CLOSED') {
              console.log('SUPABASE REALTIME CLOSED.');
            }
          });
      } catch (err) {
        console.error('SUPABASE REALTIME EXCEPTION:', err);
      }
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  private _notify(): void {
    this.listeners.forEach(fn => fn());
  }
}
