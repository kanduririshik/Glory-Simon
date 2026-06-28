import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/dataService';
import { useAuth } from '../lib/AuthContext';
import type { 
  Enquiry, 
  SiteVisit, 
  Quotation, 
  UserProfile, 
  CommunicationLog,
  StatusHistory,
  EmailLog,
  EmailTemplate,
  Client
} from '../types';


interface CRMContextType {
  enquiries: Enquiry[];
  siteVisits: SiteVisit[];
  quotations: Quotation[];
  profiles: UserProfile[];
  currentUser: UserProfile | null;
  selectedEnquiryId: string | null;
  setSelectedEnquiryId: (id: string | null) => void;
  isLoading: boolean;
  
  // Clients Operations
  clients: Client[];
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<boolean>;
  
  // Enquiries Operations
  createEnquiry: (enquiry: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Enquiry>;
  updateEnquiry: (id: string, updates: Partial<Enquiry>) => Promise<Enquiry>;
  deleteEnquiry: (id: string) => Promise<boolean>;
  getStatusHistory: (enquiryId: string) => Promise<StatusHistory[]>;
  
  // Site Visit Operations
  createSiteVisit: (visit: Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SiteVisit>;
  updateSiteVisit: (id: string, updates: Partial<SiteVisit>) => Promise<SiteVisit>;
  
  // Quotation Operations
  createQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>) => Promise<Quotation>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<Quotation>;
  
  // Communications Operations
  getCommunications: (enquiryId: string) => Promise<CommunicationLog[]>;
  logCommunication: (log: Omit<CommunicationLog, 'id' | 'createdAt'>) => Promise<CommunicationLog>;

  // Email Operations
  emailLogs: EmailLog[];
  emailTemplates: EmailTemplate[];
  getEmailLogs: (enquiryId?: string) => Promise<EmailLog[]>;
  getEmailTemplates: () => Promise<EmailTemplate[]>;
  updateEmailTemplate: (id: string, updates: Partial<EmailTemplate>) => Promise<EmailTemplate>;
  sendEmail: (params: {
    enquiryId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    emailType: string;
    attachments?: { name: string; url?: string; base64?: string; mimeType?: string }[];
  }) => Promise<{ success: boolean; messageId?: string; errorMessage?: string }>;
  uploadDocument: (fileName: string, fileBlob: Blob) => Promise<string>;



  // Profile CRUD operations
  createProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<UserProfile>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<UserProfile>;
  deleteProfile: (id: string) => Promise<boolean>;
  
  // Computed Dashboard Metrics
  metrics: {
    totalLeads: number;
    newLeads: number;
    followUps: number;
    siteVisits: number;
    quotationsSent: number;
    confirmedProjects: number;
    conversionRate: number;
    revenuePipeline: number;
    confirmedRevenue: number;
  };
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const { user: authUser } = useAuth();
  
  const currentUser: UserProfile | null = authUser ? {
    id: authUser.id,
    fullName: authUser.full_name || 'Glory Simon',
    email: authUser.email,
    role: authUser.role as UserProfile['role'],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60',
    createdAt: authUser.created_date || '2025-01-01T00:00:00Z',
  } : null;

  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all initial state
  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        api.getEnquiries(),
        api.getSiteVisits(),
        api.getQuotations(),
        api.getProfiles(),
        api.getEmailLogs(),
        api.getEmailTemplates(),
        api.getClients()
      ]);

      if (results[0].status === 'fulfilled') {
        setEnquiries(results[0].value);
      } else {
        console.error('[CRMContext] Failed to load enquiries:', results[0].reason);
        setEnquiries([]);
      }

      if (results[1].status === 'fulfilled') {
        setSiteVisits(results[1].value);
      } else {
        console.error('[CRMContext] Failed to load site visits:', results[1].reason);
        setSiteVisits([]);
      }

      if (results[2].status === 'fulfilled') {
        setQuotations(results[2].value);
      } else {
        console.error('[CRMContext] Failed to load quotations:', results[2].reason);
        setQuotations([]);
      }

      if (results[3].status === 'fulfilled') {
        setProfiles(results[3].value);
      } else {
        console.error('[CRMContext] Failed to load profiles:', results[3].reason);
        setProfiles([]);
      }

      if (results[4].status === 'fulfilled') {
        setEmailLogs(results[4].value);
      } else {
        console.error('[CRMContext] Failed to load email logs:', results[4].reason);
        setEmailLogs([]);
      }

      if (results[5].status === 'fulfilled') {
        setEmailTemplates(results[5].value);
      } else {
        console.error('[CRMContext] Failed to load email templates:', results[5].reason);
        setEmailTemplates([]);
      }

      if (results[6] && results[6].status === 'fulfilled') {
        setClients(results[6].value);
      } else {
        console.error('[CRMContext] Failed to load clients:', results[6]?.reason);
        setClients([]);
      }

    } catch (e) {
      console.error('[CRMContext] Critical failure in loadData', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to mock database changes (Emulating Real-Time sockets)
    const unsubscribe = api.subscribe(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Operations
  const createEnquiry = async (enquiryInput: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await api.createEnquiry(enquiryInput);
  };

  const updateEnquiry = async (id: string, updates: Partial<Enquiry>) => {
    return await api.updateEnquiry(id, updates);
  };

  const deleteEnquiry = async (id: string) => {
    if (selectedEnquiryId === id) setSelectedEnquiryId(null);
    return await api.deleteEnquiry(id);
  };

  const getStatusHistory = async (enquiryId: string) => {
    return await api.getStatusHistory(enquiryId);
  };

  const createSiteVisit = async (visitInput: Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await api.createSiteVisit(visitInput);
  };

  const updateSiteVisit = async (id: string, updates: Partial<SiteVisit>) => {
    return await api.updateSiteVisit(id, updates);
  };

  const createQuotation = async (quotationInput: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>) => {
    return await api.createQuotation(quotationInput);
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    return await api.updateQuotation(id, updates);
  };

  const getCommunications = async (enquiryId: string) => {
    return await api.getCommunications(enquiryId);
  };

  const logCommunication = async (logInput: Omit<CommunicationLog, 'id' | 'createdAt'>) => {
    return await api.logCommunication(logInput);
  };

  const getEmailLogs = async (enquiryId?: string) => {
    return await api.getEmailLogs(enquiryId);
  };

  const getEmailTemplates = async () => {
    return await api.getEmailTemplates();
  };

  const updateEmailTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    const updated = await api.updateEmailTemplate(id, updates);
    await loadData();
    return updated;
  };

  const sendEmail = async (params: {
    enquiryId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    emailType: string;
    attachments?: { name: string; url?: string; base64?: string; mimeType?: string }[];
  }) => {
    const result = await api.sendEmail(params);
    await loadData();
    return result;
  };

  const uploadDocument = async (fileName: string, fileBlob: Blob) => {
    return await api.uploadDocument(fileName, fileBlob);
  };



  const createProfile = async (profileInput: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newProfile = await api.createProfile({
      ...profileInput,
      id: `p-${Date.now()}` // generate simple text ID
    });
    await loadData();
    return newProfile;
  };

  const updateProfile = async (id: string, updates: Partial<UserProfile>) => {
    const updated = await api.updateProfile(id, updates);
    await loadData();
    return updated;
  };

  const deleteProfile = async (id: string) => {
    const success = await api.deleteProfile(id);
    await loadData();
    return success;
  };

  // Filter enquiries, siteVisits, quotations, etc. based on currentUser simulation
  const getFilteredData = () => {
    if (!currentUser || currentUser.role === 'Admin') {
      return {
        enquiries,
        siteVisits,
        quotations
      };
    }

    const currentUserId = currentUser.id;
    const currentRole = currentUser.role;

    // 1. Enquiries Filtering:
    // Only show enquiries assigned to the simulated staff member.
    // Except Site Engineer, who sees enquiries associated with their site visits.
    let filteredEnquiries = enquiries;
    if (currentRole === 'Site Engineer') {
      const engineerVisitEnquiryIds = new Set(siteVisits.filter(sv => sv.engineerId === currentUserId).map(sv => sv.enquiryId));
      filteredEnquiries = enquiries.filter(e => engineerVisitEnquiryIds.has(e.id) || e.assignedStaffId === currentUserId);
    } else {
      filteredEnquiries = enquiries.filter(e => e.assignedStaffId === currentUserId);
    }

    // 2. Site Visits Filtering:
    // Site Engineer sees only site visits assigned to them.
    // Others see site visits related to their assigned enquiries.
    let filteredSiteVisits = siteVisits;
    if (currentRole === 'Site Engineer') {
      filteredSiteVisits = siteVisits.filter(sv => sv.engineerId === currentUserId);
    } else {
      const assignedEnquiryIds = new Set(filteredEnquiries.map(e => e.id));
      filteredSiteVisits = siteVisits.filter(sv => assignedEnquiryIds.has(sv.enquiryId));
    }

    // 3. Quotations Filtering:
    // Non-admins see quotations assigned to them or related to their enquiries
    let filteredQuotations = quotations;
    const assignedEnquiryIds = new Set(filteredEnquiries.map(e => e.id));
    filteredQuotations = quotations.filter(q => q.consultantId === currentUserId || assignedEnquiryIds.has(q.enquiryId));

    return {
      enquiries: filteredEnquiries,
      siteVisits: filteredSiteVisits,
      quotations: filteredQuotations
    };
  };

  const { enquiries: finalEnquiries, siteVisits: finalSiteVisits, quotations: finalQuotations } = getFilteredData();

  // Computed dashboard aggregations
  const getMetrics = () => {
    const activeEnquiries = finalEnquiries.filter(e => e.status !== 'Lost');
    const totalCount = finalEnquiries.length;
    const confirmedCount = finalEnquiries.filter(e => e.status === 'Confirmed').length;
    const lostCount = finalEnquiries.filter(e => e.status === 'Lost').length;
    
    // Conversion rate (Confirmed / closed leads)
    const closedCount = confirmedCount + lostCount;
    const conversionRate = closedCount > 0 ? Math.round((confirmedCount / closedCount) * 100) : 0;
    
    const pipelineSum = activeEnquiries.reduce((sum, e) => sum + (e.budget || 0), 0);
    const confirmedSum = finalEnquiries
      .filter(e => e.status === 'Confirmed')
      .reduce((sum, e) => sum + (e.budget || 0), 0);

    return {
      totalLeads: totalCount,
      newLeads: finalEnquiries.filter(e => e.status === 'New Lead').length,
      followUps: finalEnquiries.filter(e => e.status === 'Follow Up').length,
      siteVisits: finalSiteVisits.filter(sv => sv.status === 'Scheduled').length,
      quotationsSent: finalQuotations.filter(q => q.status === 'Sent').length,
      confirmedProjects: confirmedCount,
      conversionRate,
      revenuePipeline: pipelineSum,
      confirmedRevenue: confirmedSum
    };
  };

  return (
    <CRMContext.Provider value={{
      enquiries: finalEnquiries,
      siteVisits: finalSiteVisits,
      quotations: finalQuotations,
      profiles,
      currentUser,
      selectedEnquiryId,
      setSelectedEnquiryId,
      isLoading,
      createEnquiry,
      updateEnquiry,
      deleteEnquiry,
      getStatusHistory,
      createSiteVisit,
      updateSiteVisit,
      createQuotation,
      updateQuotation,
      getCommunications,
      logCommunication,
      emailLogs,
      emailTemplates,
      getEmailLogs,
      getEmailTemplates,
      updateEmailTemplate,
      sendEmail,
      uploadDocument,

      createProfile,
      updateProfile,
      deleteProfile,
      
      clients,
      createClient: async (c) => {
        const client = await api.createClient(c);
        await loadData();
        return client;
      },
      updateClient: async (id, upd) => {
        const client = await api.updateClient(id, upd);
        await loadData();
        return client;
      },
      deleteClient: async (id) => {
        const success = await api.deleteClient(id);
        await loadData();
        return success;
      },
      
      metrics: getMetrics()
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within a CRMProvider');
  return context;
};
