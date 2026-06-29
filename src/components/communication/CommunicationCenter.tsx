import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Send, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  Check, 
  CheckCheck, 
  User, 
  Mail, 
  Paperclip, 
  ExternalLink, 
  Trash2, 
  X, 
  Eye,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Download,
  ChevronDown,
  Settings,
  Layers3,
  ArrowLeft,
  Bold,
  Italic,
  List,
  UserCheck,
  MessageSquare,
  FileDown,
  Printer,
  ChevronUp,
  Share2
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  useSimulatedPortalRole,
  useGlobalTeamFilter
} from '../../lib/assignments';
import { GlassCard } from '../ui/Card';
import { Button } from '../ui/Button';
import type { CommunicationLog, CommunicationStatus, Quotation } from '../../types';
import { ProfileCard } from '../ui/ProfileCard';
import { supabase } from '../../lib/supabase';
import { pdfService } from '../../services/pdfService';
import { motion, AnimatePresence } from 'framer-motion';
import { buildEnterpriseEmailHtml, extractEmailPreview } from '../../services/emailFormatter';

export const CommunicationCenter: React.FC = () => {
  const { 
    enquiries, 
    logCommunication, 
    profiles, 
    getCommunications, 
    emailLogs, 
    emailTemplates, 
    sendEmail, 
    uploadDocument,
    siteVisits,
    quotations,
    createSiteVisit,
    selectedEnquiryId: contextEnquiryId,
    setSelectedEnquiryId
  } = useCRM();
  
  const selectedEnquiryId = contextEnquiryId || '';
  
  const { notifications, addToast } = useNotifications();
  
  const [portalRole] = useSimulatedPortalRole();
  const [globalFilter] = useGlobalTeamFilter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Top level workspace view toggle
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'inbox' | 'audits'>('inbox');

  // Filter enquiries matching role/global selection
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      if (e.status === 'Lost') return false;
      
      let matchesAssigned = true;
      if (portalRole !== 'Admin') {
        const staffProfile = profiles.find(p => p.id === e.assignedStaffId);
        if (portalRole === 'Vendor Partner') {
          matchesAssigned = staffProfile?.role === 'Vendor Manager' || staffProfile?.role === 'Procurement Coordinator';
        } else {
          matchesAssigned = staffProfile?.role === portalRole;
        }
      } else if (globalFilter !== 'All') {
        matchesAssigned = e.assignedStaffId === globalFilter;
      }
      return matchesAssigned;
    });
  }, [enquiries, globalFilter, portalRole, profiles]);

  // Sending State
  // selectedEnquiryId is synced with CRMContext
  const [channel, setChannel] = useState<'WhatsApp' | 'Email' | 'Notifications' | 'Quotations' | 'Invoices'>('WhatsApp');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailAttachments, setEmailAttachments] = useState<{ name: string; url: string; base64?: string; mimeType?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');

  useEffect(() => {
    setEditorMode('write');
  }, [channel]);

  const previewContext = useMemo(() => {
    const lead = enquiries.find(e => e.id === selectedEnquiryId);
    if (!lead) return {};
    
    const quote = quotations.filter(q => q.enquiryId === selectedEnquiryId).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];
    const visit = siteVisits.filter(sv => sv.enquiryId === selectedEnquiryId).sort((a,b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];
    
    const assignedStaff = profiles.find(p => p.id === lead.assignedStaffId);
    const assignedEngineer = visit ? profiles.find(p => p.id === visit.engineerId) : undefined;
    
    return {
      enquiry: lead,
      quotation: quote,
      siteVisit: visit,
      assignedStaff,
      assignedEngineer,
      allProfiles: profiles,
      attachments: emailAttachments.map(a => ({ name: a.name, url: a.url }))
    };
  }, [selectedEnquiryId, enquiries, quotations, siteVisits, profiles, emailAttachments]);

  const livePreviewHtml = useMemo(() => {
    const activeTmpl = emailTemplates.find(t => t.id === selectedTemplate);
    const emailType = activeTmpl ? activeTmpl.name : 'Custom Direct Mail';
    return buildEnterpriseEmailHtml(messageContent, previewContext, emailType);
  }, [messageContent, previewContext, selectedTemplate, emailTemplates]);

  // Search filter for clients in left sidebar
  const [searchQueryClients, setSearchQueryClients] = useState('');

  // Performance timeline virtualization slicing limit
  const [messageLimit, setMessageLimit] = useState(30);

  // Audits logs states
  const [logFilter, setLogFilter] = useState<'all' | 'WhatsApp' | 'Email'>('all');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'delivered' | 'queued' | 'failed'>('all');
  const [searchQueryAudits, setSearchQueryAudits] = useState('');
  const [allLogs, setAllLogs] = useState<(CommunicationLog & { clientName: string })[]>([]);
  const [activeChatLogs, setActiveChatLogs] = useState<CommunicationLog[]>([]);
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<any>(null);
  
  // Audits pagination
  const [auditPage, setAuditPage] = useState(1);
  const auditsPerPage = 10;

  // Responsive Drawer/Mobile states
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Sticky profile collapsible cards state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true,
    project: true,
    quotation: true,
    siteVisit: false,
    designer: true,
    actions: true
  });

  // Visit Scheduler quick action modal state
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [schedulerNotes, setSchedulerNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load all communication logs from Supabase
  const loadAllLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      
      const mapped = (data || []).map((r: any) => {
        const enquiry = enquiries.find(e => e.id === r.enquiry_id);
        const log: CommunicationLog = {
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
        };
        return {
          ...log,
          clientName: enquiry ? enquiry.clientName : 'Unknown Client'
        };
      });
      
      setAllLogs(mapped);
    } catch (err) {
      console.error('[CommunicationCenter] Failed to load communication audits:', err);
    }
  };

  useEffect(() => {
    loadAllLogs();
  }, [enquiries]);

  // Load active chat logs when selected client changes
  useEffect(() => {
    if (selectedEnquiryId) {
      getCommunications(selectedEnquiryId)
        .then(logs => {
          setActiveChatLogs(logs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
          // Reset slicing limit when changing client
          setMessageLimit(30);
          // Scroll to bottom
          setTimeout(scrollToBottom, 150);
        })
        .catch(err => console.error(err));
    } else {
      setActiveChatLogs([]);
    }
  }, [selectedEnquiryId, enquiries, getCommunications]);

  // Auto-select first client in filtered list if current selection is invalid or empty
  useEffect(() => {
    if (filteredEnquiries.length > 0) {
      if (!selectedEnquiryId || !filteredEnquiries.some(e => e.id === selectedEnquiryId)) {
        setSelectedEnquiryId(filteredEnquiries[0].id);
      }
    } else {
      setSelectedEnquiryId('');
    }
  }, [filteredEnquiries, selectedEnquiryId]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Trigger scroll to bottom on message limit increase or channel changes
  useEffect(() => {
    scrollToBottom();
  }, [channel, messageLimit, activeChatLogs.length]);

  // Unified list of logs for active chat client (WhatsApp + Email logs combined)
  const unifiedChatLogs = useMemo(() => {
    const whatsapp = activeChatLogs.map(log => ({
      id: log.id,
      type: 'WhatsApp' as const,
      subject: '',
      content: log.content,
      status: log.status as string,
      createdAt: log.createdAt,
      attachments: [] as any[],
      errorMessage: log.errorMessage,
      templateName: log.templateName
    }));

    const emails = emailLogs
      .filter(log => log.enquiryId === selectedEnquiryId)
      .map(log => ({
        id: log.id,
        type: 'Email' as const,
        subject: log.subject,
        content: log.body,
        status: log.status as string,
        createdAt: log.createdAt,
        attachments: log.attachments || [],
        errorMessage: log.errorMessage,
        templateName: log.emailType,
        rawEmailLog: log
      }));

    return [...whatsapp, ...emails].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [activeChatLogs, emailLogs, selectedEnquiryId]);

  // Sliced logs for performance optimization
  const slicedChatLogs = useMemo(() => {
    return unifiedChatLogs.slice(-messageLimit);
  }, [unifiedChatLogs, messageLimit]);

  // Client notifications feed
  const clientNotifications = useMemo(() => {
    return (notifications || [])
      .filter(n => n.enquiryId === selectedEnquiryId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notifications, selectedEnquiryId]);

  // Client Sourcing history
  const clientQuotations = useMemo(() => {
    return quotations.filter(q => q.enquiryId === selectedEnquiryId);
  }, [quotations, selectedEnquiryId]);

  // Client Invoices history (Derived from Approved Quotations)
  const clientInvoices = useMemo(() => {
    return quotations.filter(q => q.enquiryId === selectedEnquiryId && q.status === 'Approved');
  }, [quotations, selectedEnquiryId]);

  // Unified logs list for bottom audits grid (Searchable, full ledger)
  const unifiedLogs = useMemo(() => {
    const whatsapp = allLogs.map(log => ({
      id: log.id,
      enquiryId: log.enquiryId,
      clientName: log.clientName,
      type: 'WhatsApp' as const,
      subject: '',
      content: log.content,
      status: log.status as string,
      createdAt: log.createdAt,
      attachments: [],
      errorMessage: log.errorMessage,
      templateName: log.templateName
    }));

    const emails = emailLogs.map(log => {
      const enquiry = enquiries.find(e => e.id === log.enquiryId);
      return {
        id: log.id,
        enquiryId: log.enquiryId,
        clientName: enquiry ? enquiry.clientName : 'Unknown Client',
        type: 'Email' as const,
        subject: log.subject,
        content: log.body,
        status: log.status as string,
        createdAt: log.createdAt,
        attachments: log.attachments || [],
        errorMessage: log.errorMessage,
        templateName: log.emailType,
        rawEmailLog: log
      };
    });

    return [...whatsapp, ...emails]
      .filter(log => {
        // Channel filter
        const matchesChannel = logFilter === 'all' || log.type === logFilter;
        // Status filter
        let matchesStatus = true;
        if (auditStatusFilter !== 'all') {
          const s = log.status?.toLowerCase();
          if (auditStatusFilter === 'delivered') {
            matchesStatus = s === 'delivered' || s === 'sent';
          } else if (auditStatusFilter === 'queued') {
            matchesStatus = s === 'queued';
          } else if (auditStatusFilter === 'failed') {
            matchesStatus = s === 'failed';
          }
        }
        // Search query
        const matchesSearch = 
          log.clientName.toLowerCase().includes(searchQueryAudits.toLowerCase()) ||
          log.content.toLowerCase().includes(searchQueryAudits.toLowerCase()) ||
          log.subject.toLowerCase().includes(searchQueryAudits.toLowerCase());
        return matchesChannel && matchesStatus && matchesSearch;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allLogs, emailLogs, enquiries, logFilter, auditStatusFilter, searchQueryAudits]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const start = (auditPage - 1) * auditsPerPage;
    return unifiedLogs.slice(start, start + auditsPerPage);
  }, [unifiedLogs, auditPage]);

  const totalAuditPages = Math.ceil(unifiedLogs.length / auditsPerPage);

  // Static templates for WhatsApp
  const whatsappTemplates = [
    { id: 'wa-welcome', name: 'Welcome Message', body: 'Dear {clientName}, thank you for reaching out to Glory Simon Interiors. We are thrilled to discuss the luxury renovation of your {location} property. A designer will call you shortly.' },
    { id: 'wa-visit', name: 'Site Visit Confirmation', body: 'Hi {clientName}, this is to confirm your site visit for the {location} property on June 8 at 10:00 AM. Our Senior Site Engineer will lead the inspection.' },
    { id: 'wa-confirm', name: 'Project Confirmation', body: 'Hi {clientName}, congratulations! We have received your retainer and confirmed your project. Our design studio has commenced CAD modeling for your space.' }
  ];

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!selectedEnquiryId) {
      addToast('Select client account', 'Please select a client account to auto-fill variables.', 'warning');
      return;
    }

    const lead = enquiries.find(e => e.id === selectedEnquiryId);
    if (!lead) return;

    if (channel === 'WhatsApp') {
      const item = whatsappTemplates.find(t => t.id === templateId);
      if (item) {
        let parsed = item.body
          .replace(/{clientName}/g, lead.clientName)
          .replace(/{location}/g, lead.location || 'site')
          .replace(/{projectType}/g, lead.projectType)
          .replace(/{budget}/g, lead.budget.toLocaleString());
        setMessageContent(parsed);
      }
    } else {
      const item = emailTemplates.find(t => t.id === templateId);
      if (item) {
        const parseText = (txt: string) => {
          return txt
            .replace(/{clientName}/g, lead.clientName)
            .replace(/{location}/g, lead.location || 'site')
            .replace(/{projectType}/g, lead.projectType)
            .replace(/{budget}/g, lead.budget.toLocaleString());
        };
        setEmailSubject(parseText(item.subject));
        setMessageContent(parseText(item.body));
      }
    }
  };

  // Rich Text Editor inserts Helper
  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('composer-textarea') as HTMLTextAreaElement | HTMLInputElement;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const text = messageContent;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    setMessageContent(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    addToast('Uploading attachment...', `Uploading ${file.name} to storage.`, 'info');

    try {
      const publicUrl = await uploadDocument(file.name, file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setEmailAttachments(prev => [
          ...prev,
          {
            name: file.name,
            url: publicUrl,
            base64: base64Data,
            mimeType: file.type
          }
        ]);
        addToast('Document Attached', `${file.name} uploaded and attached successfully.`, 'success');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('[CommunicationCenter] File upload failed:', err);
      addToast('Upload Failed', err.message || 'Could not upload attachment.', 'error');
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Message Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryId) return;

    const lead = enquiries.find(item => item.id === selectedEnquiryId);
    if (!lead) return;

    if (channel === 'Email') {
      if (!emailSubject.trim()) {
        addToast('Subject required', 'Please provide a subject line for the email.', 'warning');
        return;
      }
      if (!messageContent.trim()) {
        addToast('Content required', 'Please provide the email body content.', 'warning');
        return;
      }

      setIsSending(true);
      addToast('Dispatching email...', 'Sending email via Gmail API.', 'info');

      try {
        const activeTmpl = emailTemplates.find(t => t.id === selectedTemplate);
        const result = await sendEmail({
          enquiryId: selectedEnquiryId,
          recipientEmail: lead.email,
          subject: emailSubject,
          body: messageContent,
          emailType: activeTmpl ? activeTmpl.name : 'Custom Direct Mail',
          attachments: emailAttachments
        });

        setIsSending(false);
        if (result.success) {
          addToast('Email Dispatched', `Email sent successfully to ${lead.clientName}.`, 'success');
          setMessageContent('');
          setEmailSubject('');
          setSelectedTemplate('');
          setEmailAttachments([]);
          const logs = await getCommunications(selectedEnquiryId);
          setActiveChatLogs(logs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
          loadAllLogs();
        } else {
          addToast('Dispatch Failed', result.errorMessage || 'Failed to send email.', 'error');
        }
      } catch (err: any) {
        setIsSending(false);
        addToast('Transmission Error', err.message || 'Error occurred while sending.', 'error');
      }
    } else if (channel === 'WhatsApp') {
      // WhatsApp sending
      if (!messageContent.trim()) return;
      setIsSending(true);
      addToast('Dispatching WhatsApp...', 'Sending queue packet to carrier.', 'info');

      setTimeout(async () => {
        const willFail = Math.random() < 0.15;
        const status: CommunicationStatus = willFail ? 'Failed' : 'Sent';
        const errorMessage = willFail ? 'SMS network drop: carrier timeout 503' : undefined;

        try {
          await logCommunication({
            enquiryId: selectedEnquiryId,
            type: 'WhatsApp',
            direction: 'Outbound',
            templateName: whatsappTemplates.find(t => t.id === selectedTemplate)?.name || 'Custom',
            content: messageContent,
            status,
            sentById: 'p2',
            errorMessage
          });

          setIsSending(false);
          setMessageContent('');
          setSelectedTemplate('');
          
          if (willFail) {
            addToast('Transmission failed', 'Verify network or carrier code.', 'error');
          } else {
            addToast('Message Delivered', `Dispatched WhatsApp message to ${lead.clientName}.`, 'success');
          }
          
          loadAllLogs();
          const logs = await getCommunications(selectedEnquiryId);
          setActiveChatLogs(logs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        } catch (err) {
          setIsSending(false);
          addToast('Database logging error', 'Check CRM database settings.', 'error');
        }
      }, 1200);
    }
  };

  // Retry sending failed WhatsApp message
  const handleRetryWhatsApp = async (logId: string, enquiryId: string) => {
    addToast('Retrying transmission...', 'Resubmitting queue packet.', 'info');
    
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('communication_logs')
          .update({
            status: 'Delivered',
            error_message: null
          })
          .eq('id', logId);

        if (error) throw error;
        
        addToast('Retry Successful', 'Message delivered to carrier.', 'success');
        loadAllLogs();
        if (selectedEnquiryId === enquiryId) {
          const logs = await getCommunications(enquiryId);
          setActiveChatLogs(logs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        }
      } catch (err: any) {
        console.error('[CommunicationCenter] Retry failed:', err);
        addToast('Retry Failed', err?.message || 'Please try again.', 'error');
      }
    }, 800);
  };

  // Export Audits to CSV
  const handleExportCSV = () => {
    const headers = ['Client', 'Channel', 'Content/Subject', 'Status', 'Date'];
    const rows = unifiedLogs.map(log => [
      log.clientName,
      log.type,
      log.type === 'Email' ? `[Email] ${log.subject}` : log.content,
      log.status,
      new Date(log.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `communication_audits_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Ledger Exported', 'Communication audits CSV downloaded successfully.', 'success');
  };

  // Schedule site visit Quick Action Handler
  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryId || !scheduledAt || !selectedEngineerId) return;

    const visitDate = new Date(scheduledAt);
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());

    if (visitDateOnly < todayDate) {
      addToast('Cannot book past dates', 'You cannot book inspections for past dates.', 'warning');
      return;
    }
    
    setIsScheduling(true);
    try {
      await createSiteVisit({
        enquiryId: selectedEnquiryId,
        scheduledAt,
        status: 'Scheduled',
        engineerId: selectedEngineerId,
        notes: schedulerNotes
      });
      addToast('Site Visit Scheduled', 'New site visit successfully logged.', 'success');
      setIsSchedulerOpen(false);
      setScheduledAt('');
      setSelectedEngineerId('');
      setSchedulerNotes('');
    } catch (err: any) {
      addToast('Scheduling Failed', err?.message || 'Error logging site visit.', 'error');
    } finally {
      setIsScheduling(false);
    }
  };

  // Quotation Sourcing Helpers
  const handleDownloadQuotation = (quote: Quotation, clientName: string, location: string) => {
    const consultant = profiles.find(p => p.id === quote.consultantId);
    const consultantName = consultant ? consultant.fullName : 'Glory Simon';

    const doc = pdfService.generateQuotationPDF(quote, clientName, location, consultantName);
    pdfService.download(doc, `${quote.quotationNumber}_Quotation.pdf`);
    addToast('PDF Saved', 'Quotation document successfully downloaded.', 'success');
  };

  const handlePreviewQuotation = (quote: Quotation, clientName: string, location: string) => {
    const consultant = profiles.find(p => p.id === quote.consultantId);
    const consultantName = consultant ? consultant.fullName : 'Glory Simon';

    const doc = pdfService.generateQuotationPDF(quote, clientName, location, consultantName);
    const url = pdfService.preview(doc);
    window.open(url, '_blank');
  };

  // Invoice Sourcing Helpers
  const handleDownloadInvoice = (quote: Quotation, clientName: string, location: string) => {
    const consultant = profiles.find(p => p.id === quote.consultantId);
    const consultantName = consultant ? consultant.fullName : 'Glory Simon';
    const invoiceNumber = quote.quotationNumber.replace('QT', 'INV');
    const invoiceItems = quote.items.map(i => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.amount
    }));

    const doc = pdfService.generateInvoicePDF(
      invoiceNumber,
      clientName,
      location,
      quote.amount,
      invoiceItems,
      consultantName,
      quote.updatedAt
    );
    pdfService.download(doc, `${invoiceNumber}_Invoice.pdf`);
    addToast('PDF Saved', 'Invoice ledger successfully downloaded.', 'success');
  };

  const handlePreviewInvoice = (quote: Quotation, clientName: string, location: string) => {
    const consultant = profiles.find(p => p.id === quote.consultantId);
    const consultantName = consultant ? consultant.fullName : 'Glory Simon';
    const invoiceNumber = quote.quotationNumber.replace('QT', 'INV');
    const invoiceItems = quote.items.map(i => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.amount
    }));

    const doc = pdfService.generateInvoicePDF(
      invoiceNumber,
      clientName,
      location,
      quote.amount,
      invoiceItems,
      consultantName,
      quote.updatedAt
    );
    const url = pdfService.preview(doc);
    window.open(url, '_blank');
  };

  // Render Checkmarks based on status
  const renderStatus = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'delivered':
        return <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Sent':
      case 'sent':
        return <Check className="h-3.5 w-3.5 text-[#E6C27A]" />;
      case 'queued':
        return <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
      case 'Failed':
      case 'failed':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <Check className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  // Search filtered clients list
  const searchedClients = useMemo(() => {
    return filteredEnquiries.filter(e => {
      const query = searchQueryClients.toLowerCase();
      const lastWhatsapp = allLogs.filter(log => log.enquiryId === e.id);
      const lastEmail = emailLogs.filter(log => log.enquiryId === e.id);
      const previewText = [...lastWhatsapp.map(w => w.content), ...lastEmail.map(m => m.subject)].join(' ').toLowerCase();

      return (
        e.clientName.toLowerCase().includes(query) ||
        e.projectType.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        previewText.includes(query)
      );
    });
  }, [filteredEnquiries, searchQueryClients, allLogs, emailLogs]);

  const selectedEnquiry = enquiries.find(e => e.id === selectedEnquiryId);
  const assignedDesignerProfile = selectedEnquiry ? profiles.find(p => p.id === selectedEnquiry.assignedStaffId) : null;

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] text-[#F5F1EA] font-sans">
      
      {/* Workspace Header Toolbar */}
      <div className="h-14 border-b border-[#D4A65A]/15 bg-[#111111] px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#D4A65A]" />
          <h1 className="text-base font-serif font-medium text-[#E6C27A] tracking-wider uppercase">Correspondence Desk</h1>
        </div>

        <div className="flex items-center bg-[#050505] border border-[#D4A65A]/20 rounded-xl p-0.5 font-sans text-xs">
          <button
            onClick={() => setActiveWorkspaceTab('inbox')}
            className={`px-4 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeWorkspaceTab === 'inbox' ? 'bg-[#D4A65A] text-black font-bold' : 'text-[#CBBEAB] hover:text-[#D4A65A]'
            }`}
          >
            Live Inbox Workspace
          </button>
          <button
            onClick={() => setActiveWorkspaceTab('audits')}
            className={`px-4 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeWorkspaceTab === 'audits' ? 'bg-[#D4A65A] text-black font-bold' : 'text-[#CBBEAB] hover:text-[#D4A65A]'
            }`}
          >
            Outbound Audit Ledger
          </button>
        </div>
      </div>

      {/* Main Workspace Switch */}
      {activeWorkspaceTab === 'inbox' ? (
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT SIDEBAR (22% on desktop, 30% on laptop/tablet, 100% on mobile list state) */}
          <div className={`shrink-0 border-r border-[#D4A65A]/15 bg-[#111111] flex flex-col transition-all duration-300 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'w-full md:w-[30%] lg:w-[22%]'
          }`}>
            {/* Search clients */}
            <div className="p-4 border-b border-[#D4A65A]/10 space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-[#8B7355] uppercase font-semibold">Client Channels</span>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
                <input
                  type="text"
                  placeholder="Search client inbox..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#050505] text-white border border-[#D4A65A]/25 rounded-xl focus:border-[#D4A65A] focus:ring-1 focus:ring-[#D4A65A] outline-none"
                  value={searchQueryClients}
                  onChange={e => setSearchQueryClients(e.target.value)}
                />
              </div>
            </div>

            {/* Scrollable clients cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-none">
              {searchedClients.map(e => {
                const isActive = selectedEnquiryId === e.id;
                
                // Find last communications
                const clientWhatsapp = allLogs.filter(log => log.enquiryId === e.id);
                const clientEmails = emailLogs.filter(log => log.enquiryId === e.id);
                
                let lastMsg = 'No communication logged.';
                let lastTime = '';
                
                const combined = [
                  ...clientWhatsapp.map(w => ({ body: w.content, time: w.createdAt })),
                  ...clientEmails.map(m => ({ body: `Email: ${m.subject}`, time: m.createdAt }))
                ].sort((a, b) => b.time.localeCompare(a.time));

                if (combined.length > 0) {
                  lastMsg = combined[0].body;
                  lastTime = new Date(combined[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                // Simulated unread logic (gives unread count based on id to look rich)
                const mockUnreadCount = (e.id === 'e1' || e.id === 'e6') && !isActive ? 1 : 0;
                
                // Avatar initials
                const initials = e.clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <motion.div
                    key={e.id}
                    onClick={() => {
                      setSelectedEnquiryId(e.id);
                      setMobileView('chat');
                    }}
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 text-left relative ${
                      isActive 
                        ? 'bg-[#D4A65A]/10 border-[#D4A65A] shadow-[0_4px_20px_rgba(212,166,90,0.12)] elevated' 
                        : 'bg-[#171717]/50 border-white/5 hover:bg-[#D4A65A]/5 hover:border-[#D4A65A]/30'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          isActive ? 'bg-[#D4A65A] text-black border-[#E6C27A]' : 'bg-[#050505] text-[#D4A65A] border-white/5'
                        }`}>
                          {initials}
                        </div>
                        {mockUnreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#E6C27A] border border-[#111] flex items-center justify-center text-[7.5px] text-black font-extrabold">
                            {mockUnreadCount}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-xs font-bold text-[#F5F1EA] truncate">{e.clientName}</h4>
                          <span className="text-[8px] text-slate-500 font-mono flex-shrink-0 mt-0.5">{lastTime}</span>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] font-mono text-[#CBBEAB] truncate max-w-[70%]">{e.projectType}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider ${
                            e.status === 'Confirmed' ? 'bg-[#9BCF8A]/10 text-[#9BCF8A] border border-[#9BCF8A]/20' :
                            e.status === 'Lost' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' :
                            'bg-[#D4A65A]/10 text-[#E6C27A] border border-[#D4A65A]/20'
                          }`}>
                            {e.status}
                          </span>
                        </div>

                        <p className="text-[10px] text-[#CBBEAB]/70 truncate mt-1.5 font-light leading-relaxed">
                          {lastMsg}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {searchedClients.length === 0 && (
                <div className="text-center py-8 text-[#CBBEAB]/50 text-xs italic">
                  No clients found.
                </div>
              )}
            </div>
          </div>

          {/* CENTER PANEL - CONVERSATION AREA (53% on desktop, 70% on laptop/tablet, 100% on mobile chat state) */}
          <div className={`flex-grow border-r border-[#D4A65A]/15 bg-[#050505] flex flex-col relative transition-all duration-300 ${
            mobileView === 'list' ? 'hidden md:flex' : 'w-full md:w-[70%] lg:w-[53%]'
          }`}>
            {selectedEnquiryId ? (
              <>
                {/* Client header */}
                <div className="h-16 border-b border-[#D4A65A]/10 bg-[#111111] px-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setMobileView('list')}
                      className="p-1 rounded bg-[#050505] hover:bg-[#D4A65A]/10 text-[#D4A65A] md:hidden cursor-pointer"
                    >
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </button>
                    
                    <div className="h-9 w-9 rounded-lg bg-[#D4A65A]/10 border border-[#D4A65A]/20 flex items-center justify-center">
                      <User className="h-4.5 w-4.5 text-[#D4A65A]" />
                    </div>
                    
                    <div className="text-left min-w-0">
                      <h4 className="text-xs font-bold text-[#F5F1EA] truncate max-w-[120px] sm:max-w-[200px]">{selectedEnquiry?.clientName}</h4>
                      <p className="text-[9.5px] text-[#CBBEAB]/70 font-mono tracking-wide truncate max-w-[150px] sm:max-w-[250px]">{selectedEnquiry?.email}</p>
                    </div>
                  </div>

                  {/* Channel/History Selector Tabs */}
                  <div className="flex items-center gap-0.5 bg-[#050505] border border-white/5 rounded-xl p-0.5 text-[10px]">
                    {(['WhatsApp', 'Email', 'Notifications', 'Quotations', 'Invoices'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => { setChannel(tab); setSelectedTemplate(''); setMessageContent(''); }}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                          channel === tab ? 'bg-[#D4A65A] text-black font-bold' : 'text-[#CBBEAB] hover:text-[#D4A65A]'
                        }`}
                      >
                        {tab === 'Notifications' ? 'Alerts' : tab === 'Quotations' ? 'Quotes' : tab}
                      </button>
                    ))}
                  </div>

                  {/* Toggle button for right side profile card in tablet mode */}
                  <button
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                    className="lg:hidden p-2 rounded bg-[#050505] hover:bg-[#D4A65A]/10 text-[#D4A65A] cursor-pointer"
                    title="Toggle client profile"
                  >
                    <Settings className="h-4.5 w-4.5 animate-spin-hover" />
                  </button>
                </div>

                {/* Message Timeline feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none flex flex-col">
                  {channel === 'WhatsApp' || channel === 'Email' ? (
                    <>
                      {/* Virtualized/Sliced indicators */}
                      {unifiedChatLogs.length > messageLimit && (
                        <button
                          onClick={() => setMessageLimit(prev => prev + 30)}
                          className="self-center flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#111111] hover:bg-[#D4A65A]/10 border border-[#D4A65A]/20 text-[9px] font-mono text-[#D4A65A] tracking-wider uppercase transition-colors cursor-pointer mb-2"
                        >
                          <RefreshCw className="h-3 w-3" /> Load older dispatches ({unifiedChatLogs.length - messageLimit} remaining)
                        </button>
                      )}

                      {slicedChatLogs.map(log => {
                        const isEmail = log.type === 'Email';
                        const isFailed = log.status === 'Failed';
                        
                        if (isEmail) {
                          return (
                            <div key={log.id} className="w-full flex justify-start">
                              {/* Email Card (premium display) */}
                              <div className="w-[90%] rounded-xl border border-[#D4A65A]/35 bg-[#12100E] p-4 text-xs font-light text-left transition-all hover:border-[#D4A65A] hover:shadow-[0_4px_16px_rgba(212,166,90,0.08)]">
                                <div className="flex justify-between items-center border-b border-[#D4A65A]/15 pb-2 mb-2 font-mono text-[9px] text-[#CBBEAB]">
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="h-3 w-3 text-[#D4A65A]" />
                                    <span>From: <strong className="text-white font-medium">Glory Simon Interiors</strong></span>
                                    <span>•</span>
                                    <span>To: <strong className="text-white font-medium">{selectedEnquiry?.email}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                                    <button
                                      onClick={() => setSelectedEmailForPreview(log.rawEmailLog)}
                                      className="p-1 rounded bg-[#D4A65A]/10 border border-[#D4A65A]/25 text-[#D4A65A] hover:bg-[#D4A65A]/20 transition-colors"
                                      title="Open Full Preview"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                <h4 className="text-xs font-bold text-white mb-1.5">Subject: <span className="text-[#D4A65A]">{log.subject}</span></h4>
                                <p className="whitespace-pre-wrap text-[#CBBEAB] leading-relaxed line-clamp-4">{extractEmailPreview(log.content)}</p>
                                
                                {log.attachments && log.attachments.length > 0 && (
                                  <div className="mt-3 pt-2.5 border-t border-[#D4A65A]/10 flex flex-wrap gap-1.5">
                                    {log.attachments.map((att: any, idx: number) => (
                                      <a
                                        key={idx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/5 text-[9px] text-[#D4A65A] hover:text-white transition-colors"
                                      >
                                        <Paperclip className="h-2.5 w-2.5" />
                                        <span className="max-w-[120px] truncate">{att.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          // WhatsApp bubble
                          return (
                            <div 
                              key={log.id} 
                              className={`flex flex-col ${isFailed ? 'items-end' : 'items-end'}`}
                            >
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 border text-xs leading-relaxed font-light text-left relative transition-all ${
                                log.errorMessage ? 'bg-rose-950/10 border-rose-500/20 text-[#CBBEAB]' :
                                'bg-[#D4A65A]/10 border-[#D4A65A]/30 text-white rounded-tr-none ml-auto'
                              }`}>
                                <p className="whitespace-pre-wrap">{log.content}</p>
                                
                                <div className="flex items-center justify-end gap-1.5 mt-2 text-[8px] text-[#CBBEAB]/65 font-mono">
                                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>{renderStatus(log.status)}</span>
                                </div>
                              </div>
                              
                              {isFailed && (
                                <button
                                  onClick={() => handleRetryWhatsApp(log.id, selectedEnquiryId)}
                                  className="flex items-center gap-1 text-[9px] text-[#D99A6C] mt-1.5 hover:underline font-mono"
                                >
                                  <RefreshCw className="h-3 w-3 animate-spin-hover" /> Retry Delivery
                                </button>
                              )}
                            </div>
                          );
                        }
                      })}
                      {unifiedChatLogs.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#CBBEAB]/50 text-xs">
                          <MessageSquare className="h-8 w-8 text-[#D4A65A]/20 mb-2" />
                          No correspondence dispatches registered. Composer a message below to begin.
                        </div>
                      )}
                    </>
                  ) : channel === 'Notifications' ? (
                    // Client notifications timeline view
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono tracking-wider text-[#8B7355] uppercase font-semibold block text-left">Automated CRM Audit Notifications</span>
                      {clientNotifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3.5 rounded-xl border text-left flex gap-3 items-start transition-all hover:bg-[#171717]/40 ${
                            n.read ? 'bg-[#171717]/20 border-white/5 text-[#CBBEAB]' : 'bg-[#D4A65A]/5 border-[#D4A65A]/30 text-white'
                          }`}
                        >
                          <div className={`p-1.5 rounded bg-black/40 border ${
                            n.type === 'success' ? 'border-[#9BCF8A] text-[#9BCF8A]' :
                            n.type === 'error' ? 'border-rose-500 text-rose-500' :
                            'border-[#D4A65A] text-[#D4A65A]'
                          }`}>
                            {n.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : 
                             n.type === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> : 
                             <UserCheck className="h-3.5 w-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold font-mono tracking-wide">{n.title}</h4>
                              <span className="text-[8px] text-slate-500 font-mono mt-0.5">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-[10.5px] mt-1 leading-relaxed text-[#CBBEAB]/80 font-light">{n.message}</p>
                          </div>
                        </div>
                      ))}
                      {clientNotifications.length === 0 && (
                        <div className="py-16 text-center text-[#CBBEAB]/50 text-xs italic">
                          No audit alerts received for this client lead.
                        </div>
                      )}
                    </div>
                  ) : channel === 'Quotations' ? (
                    /* Proposals Timeline tab view */
                    <div className="space-y-4 text-left animate-fade-in">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] font-mono tracking-wider text-[#8B7355] uppercase font-semibold">Sourcing Proposals & Quotes</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientQuotations.map(quote => (
                          <div key={quote.id} className="p-4 rounded-xl border border-white/5 bg-[#171717]/50 space-y-3 relative hover:border-[#D4A65A]/45 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-mono text-slate-500 block">{quote.quotationNumber}</span>
                                <span className="text-xs font-bold text-white block mt-0.5">Sourcing proposal</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-semibold uppercase ${
                                quote.status === 'Approved' ? 'bg-[#9BCF8A]/10 text-emerald-400 border border-[#9BCF8A]/20' :
                                quote.status === 'Rejected' ? 'bg-rose-500/10 text-rose-405 border border-rose-500/20' :
                                quote.status === 'Sent' ? 'bg-[#D4A65A]/15 text-[#E6C27A] border border-[#D4A65A]/25' :
                                'bg-slate-800 text-slate-400 border border-white/5'
                              }`}>
                                {quote.status}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[11px] font-mono">
                              <span className="text-slate-500">{quote.items.length} items</span>
                              <span className="font-sans font-bold text-[#E6C27A] text-xs">${quote.amount.toLocaleString()}</span>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handlePreviewQuotation(quote, selectedEnquiry?.clientName || 'Client', selectedEnquiry?.location || 'Site')}
                                className="flex-1 py-1.5 rounded bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                              >
                                <Eye className="h-3 w-3" /> Preview
                              </button>
                              <button
                                onClick={() => handleDownloadQuotation(quote, selectedEnquiry?.clientName || 'Client', selectedEnquiry?.location || 'Site')}
                                className="flex-1 py-1.5 rounded bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                              >
                                <FileDown className="h-3 w-3" /> Download
                              </button>
                            </div>
                          </div>
                        ))}
                        {clientQuotations.length === 0 && (
                          <div className="col-span-full py-12 text-center text-[#CBBEAB]/50 text-xs italic">
                            No quotations prepared for this client.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Invoices Timeline tab view */
                    <div className="space-y-4 text-left animate-fade-in">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] font-mono tracking-wider text-[#8B7355] uppercase font-semibold">Confirmed Sourcing Invoices</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientInvoices.map(quote => {
                          const invoiceNumber = quote.quotationNumber.replace('QT', 'INV');
                          return (
                            <div key={quote.id} className="p-4 rounded-xl border border-emerald-500/10 bg-[#171717]/50 space-y-3 relative hover:border-emerald-500/40 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] font-mono text-emerald-400 block font-semibold">{invoiceNumber}</span>
                                  <span className="text-xs font-bold text-white block mt-0.5">Sourcing Invoice</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded text-[7px] font-mono font-bold uppercase bg-emerald-950/40 text-emerald-405 border border-emerald-500/20">
                                  due on receipt
                                </span>
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[11px] font-mono">
                                <span className="text-slate-500">Sourcing Total</span>
                                <span className="font-sans font-bold text-emerald-450 text-xs">${quote.amount.toLocaleString()}</span>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => handlePreviewInvoice(quote, selectedEnquiry?.clientName || 'Client', selectedEnquiry?.location || 'Site')}
                                  className="flex-1 py-1.5 rounded bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                                >
                                  <Eye className="h-3 w-3" /> Preview
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(quote, selectedEnquiry?.clientName || 'Client', selectedEnquiry?.location || 'Site')}
                                  className="flex-1 py-1.5 rounded bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                                >
                                  <FileDown className="h-3 w-3" /> Download
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {clientInvoices.length === 0 && (
                          <div className="col-span-full py-12 text-center text-[#CBBEAB]/50 text-xs italic">
                            No confirmed sourcing invoices ready.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={feedEndRef} />
                </div>

                {/* BOTTOM COMPOSER */}
                {(channel === 'WhatsApp' || channel === 'Email') && (
                  <form onSubmit={handleSendMessage} className="border-t border-[#D4A65A]/15 bg-[#111111] p-4 space-y-3 shrink-0 text-left">
                    {/* Subject line (Email only) */}
                    {channel === 'Email' && (
                      <div className="relative">
                        <input
                          required
                          type="text"
                          placeholder="Email Subject Line..."
                          className="w-full text-xs bg-[#050505] text-white border border-[#D4A65A]/25 rounded-xl px-4 py-2 focus:border-[#D4A65A] outline-none"
                          value={emailSubject}
                          onChange={e => setEmailSubject(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Toolbar actions bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        {channel === 'Email' && (
                          <div className="flex bg-[#050505] border border-[#D4A65A]/25 rounded-lg p-0.5 mr-2 font-mono text-[9px]">
                            <button
                              type="button"
                              onClick={() => setEditorMode('write')}
                              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                                editorMode === 'write' ? 'bg-[#D4A65A] text-black font-bold' : 'text-[#CBBEAB] hover:text-[#D4A65A]'
                              }`}
                            >
                              Write
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditorMode('preview')}
                              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                                editorMode === 'preview' ? 'bg-[#D4A65A] text-black font-bold' : 'text-[#CBBEAB] hover:text-[#D4A65A]'
                              }`}
                            >
                              Preview
                            </button>
                          </div>
                        )}

                        {/* Editor action mockups (only visible in write mode) */}
                        {(editorMode === 'write') && (
                          <>
                            <button
                              type="button"
                              onClick={() => insertText('**', '**')}
                              className="p-1.5 rounded hover:bg-white/5 text-[#CBBEAB] hover:text-white transition-colors cursor-pointer"
                              title="Bold"
                            >
                              <Bold className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertText('*', '*')}
                              className="p-1.5 rounded hover:bg-white/5 text-[#CBBEAB] hover:text-white transition-colors cursor-pointer"
                              title="Italic"
                            >
                              <Italic className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertText('\n- ')}
                              className="p-1.5 rounded hover:bg-white/5 text-[#CBBEAB] hover:text-white transition-colors cursor-pointer"
                              title="Bullet list"
                            >
                              <List className="h-3.5 w-3.5" />
                            </button>
                            <div className="h-4 w-[1px] bg-white/10 mx-1" />
                          </>
                        )}

                        {/* Templates selector dropdown */}
                        <select
                          className="appearance-none pl-3 pr-8 py-1 text-[9.5px] cursor-pointer bg-[#050505] text-white border border-[#D4A65A]/20 rounded-lg outline-none"
                          value={selectedTemplate}
                          onChange={e => handleTemplateChange(e.target.value)}
                        >
                          <option value="">Draft template (None)</option>
                          {channel === 'WhatsApp' 
                            ? whatsappTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                            : emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                          }
                        </select>
                      </div>

                      {/* Recipient note info */}
                      <span className="text-[9px] font-mono text-[#CBBEAB]/60">
                        Dispatching to: <strong className="text-[#E6C27A] font-semibold">{channel === 'Email' ? selectedEnquiry?.email : selectedEnquiry?.phoneNumber}</strong>
                      </span>
                    </div>

                    {/* Composer text input block */}
                    <div className="flex gap-2 items-start">
                      {channel === 'Email' ? (
                        editorMode === 'preview' ? (
                          <div className="flex-grow border border-[#D4A65A]/25 rounded-xl overflow-hidden bg-[#050505] h-48">
                            <iframe
                              title="Live Email Preview"
                              srcDoc={livePreviewHtml}
                              className="w-full h-full border-none"
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>
                        ) : (
                          <textarea
                            id="composer-textarea"
                            required
                            rows={4}
                            placeholder="Compose luxury email body..."
                            className="flex-grow text-xs bg-[#050505] text-white border border-[#D4A65A]/25 rounded-xl px-4 py-2.5 focus:border-[#D4A65A] outline-none resize-none font-sans"
                            value={messageContent}
                            onChange={e => setMessageContent(e.target.value)}
                          />
                        )
                      ) : (
                        <input
                          id="composer-textarea"
                          required
                          type="text"
                          placeholder="Type customer WhatsApp message..."
                          className="flex-grow text-xs bg-[#050505] text-white border border-[#D4A65A]/25 rounded-xl px-4 py-2.5 focus:border-[#D4A65A] outline-none"
                          value={messageContent}
                          onChange={e => setMessageContent(e.target.value)}
                        />
                      )}

                      <div className="flex flex-col gap-2 self-stretch justify-between">
                        {/* Email attachment button */}
                        {channel === 'Email' && (
                          <div className="relative">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              accept="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="p-3 bg-[#171717] hover:bg-[#D4A65A]/10 border border-[#D4A65A]/25 rounded-xl text-[#CBBEAB] hover:text-[#D4A65A] transition-colors disabled:opacity-50 cursor-pointer"
                              title="Attach documents"
                            >
                              <Paperclip className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        )}

                        <Button type="submit" isLoading={isSending} className="flex items-center justify-center p-3 rounded-xl shrink-0 h-10 w-12 bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Attachment queue list */}
                    {emailAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5 mt-2">
                        {emailAttachments.map((file, idx) => (
                          <span 
                            key={idx}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black border border-[#D4A65A]/20 text-[9.5px] text-[#F5F1EA]"
                          >
                            <Paperclip className="h-3 w-3 text-[#D4A65A]" />
                            <span className="truncate max-w-[140px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="p-0.5 hover:bg-white/10 rounded text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </form>
                )}
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-[#CBBEAB]/50 text-xs">
                <Layers3 className="h-10 w-10 text-[#D4A65A]/25 mb-3" />
                Select a client account to render active chat timelines.
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Sticky Client Profile Summary (25% on desktop, drawer on tablet/laptop, hidden on mobile) */}
          {/* Backdrop overlay for tablet drawer */}
          <AnimatePresence>
            {rightPanelOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRightPanelOpen(false)}
                className="lg:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity"
              />
            )}
          </AnimatePresence>

          <div className={`shrink-0 bg-[#111111] overflow-y-auto flex flex-col z-30 transition-all duration-300 ${
            // Responsive width/overlay rules
            rightPanelOpen 
              ? 'fixed right-0 top-0 h-screen w-[320px] shadow-2xl border-l border-[#D4A65A]/20' 
              : 'hidden lg:flex lg:w-[25%]'
          }`}>
            
            {/* Drawer Close Button for tablets */}
            {rightPanelOpen && (
              <div className="p-3 flex justify-end lg:hidden border-b border-[#D4A65A]/10 bg-[#171717]">
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="p-1 rounded bg-[#050505] border border-white/5 text-[#CBBEAB] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {selectedEnquiry ? (
              <div className="p-4 space-y-4 text-left">
                {/* Client Avatar Profile Header */}
                <div className="flex flex-col items-center text-center p-4 border border-[#D4A65A]/25 rounded-2xl bg-[#171717]/50 shadow-soft-luxe relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A65A]/4 rounded-full filter blur-xl pointer-events-none" />
                  <div className="h-16 w-16 rounded-full bg-[#D4A65A]/10 border-2 border-[#D4A65A] flex items-center justify-center text-white text-lg font-serif font-bold shadow-md">
                    {selectedEnquiry.clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-sm font-serif font-bold text-white mt-3">{selectedEnquiry.clientName}</h3>
                  <span className="text-[10px] text-[#D4A65A] font-semibold font-mono tracking-wider mt-1">{selectedEnquiry.companyName || 'Private Client'}</span>
                </div>

                {/* Collapsible cards system (Accordion) */}
                <div className="space-y-3">
                  
                  {/* COLLAPSIBLE 1: Contact Details */}
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-[#171717]/30">
                    <button
                      onClick={() => toggleSection('contact')}
                      className="w-full px-3 py-2.5 bg-[#171717]/60 flex items-center justify-between text-[10px] font-mono text-[#E6C27A] uppercase tracking-wider font-semibold hover:bg-[#171717]/90 transition-colors border-b border-white/5"
                    >
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Contact Profile</span>
                      {expandedSections.contact ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedSections.contact && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3.5 space-y-3 text-xs font-light text-[#CBBEAB] overflow-hidden"
                        >
                          <div>
                            <span className="block text-[8px] font-mono text-[#8B7355] uppercase tracking-wider">Email Address</span>
                            <strong className="block text-white font-medium break-all mt-0.5">{selectedEnquiry.email}</strong>
                          </div>
                          <div>
                            <span className="block text-[8px] font-mono text-[#8B7355] uppercase tracking-wider">Phone number</span>
                            <strong className="block text-white font-medium mt-0.5">{selectedEnquiry.phoneNumber}</strong>
                          </div>
                          <div>
                            <span className="block text-[8px] font-mono text-[#8B7355] uppercase tracking-wider">Sourcing Location</span>
                            <strong className="block text-white font-medium flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-[#D4A65A]" /> {selectedEnquiry.location}
                            </strong>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* COLLAPSIBLE 2: Project status */}
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-[#171717]/30">
                    <button
                      onClick={() => toggleSection('project')}
                      className="w-full px-3 py-2.5 bg-[#171717]/60 flex items-center justify-between text-[10px] font-mono text-[#E6C27A] uppercase tracking-wider font-semibold hover:bg-[#171717]/90 transition-colors border-b border-white/5"
                    >
                      <span className="flex items-center gap-1.5"><Layers3 className="h-3.5 w-3.5" /> Sourcing Status</span>
                      {expandedSections.project ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedSections.project && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3.5 space-y-3.5 text-xs font-light text-[#CBBEAB] overflow-hidden"
                        >
                          <div>
                            <span className="block text-[8px] font-mono text-[#8B7355] uppercase tracking-wider">Lead/Enquiry status</span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider mt-1 ${
                              selectedEnquiry.status === 'Confirmed' ? 'bg-[#9BCF8A]/15 text-[#9BCF8A] border border-[#9BCF8A]/25' :
                              selectedEnquiry.status === 'Lost' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' :
                              'bg-[#D4A65A]/15 text-[#E6C27A] border border-[#D4A65A]/25'
                            }`}>
                              {selectedEnquiry.status}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[8px] font-mono text-[#8B7355] uppercase tracking-wider">Sourcing Project Scope</span>
                            <strong className="block text-white font-medium mt-0.5">{selectedEnquiry.projectType}</strong>
                          </div>

                          {/* Visual Sourcing budget */}
                          <div>
                            <span className="block text-[8px] font-mono text-[#8B7355] uppercase tracking-wider">Allocated Sourcing budget</span>
                            <strong className="block text-sm font-bold text-[#E6C27A] font-mono mt-0.5">${selectedEnquiry.budget.toLocaleString()}</strong>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* COLLAPSIBLE 3: Quotation cost Proposal status */}
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-[#171717]/30">
                    <button
                      onClick={() => toggleSection('quotation')}
                      className="w-full px-3 py-2.5 bg-[#171717]/60 flex items-center justify-between text-[10px] font-mono text-[#E6C27A] uppercase tracking-wider font-semibold hover:bg-[#171717]/90 transition-colors border-b border-white/5"
                    >
                      <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Proposals & Costs</span>
                      {expandedSections.quotation ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedSections.quotation && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3.5 space-y-2.5 text-xs text-[#CBBEAB] overflow-hidden"
                        >
                          {clientQuotations.map(quote => (
                            <div key={quote.id} className="p-2 border border-white/5 rounded-lg bg-black/40 flex justify-between items-center text-[10.5px]">
                              <div>
                                <strong className="text-white block font-mono text-[9px]">{quote.quotationNumber}</strong>
                                <span className="text-[#D4A65A] font-mono font-medium">${quote.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold uppercase ${
                                  quote.status === 'Approved' ? 'bg-[#9BCF8A]/10 text-emerald-400 border border-[#9BCF8A]/20' :
                                  quote.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  'bg-[#D4A65A]/10 text-[#E6C27A] border border-[#D4A65A]/20'
                                }`}>
                                  {quote.status}
                                </span>
                              </div>
                            </div>
                          ))}
                          {clientQuotations.length === 0 && (
                            <span className="text-[10px] italic text-[#CBBEAB]/50 font-light block py-2">No cost dispatches scheduled yet.</span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* COLLAPSIBLE 4: Site Visit schedule */}
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-[#171717]/30">
                    <button
                      onClick={() => toggleSection('siteVisit')}
                      className="w-full px-3 py-2.5 bg-[#171717]/60 flex items-center justify-between text-[10px] font-mono text-[#E6C27A] uppercase tracking-wider font-semibold hover:bg-[#171717]/90 transition-colors border-b border-white/5"
                    >
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Site Visit Inspection</span>
                      {expandedSections.siteVisit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedSections.siteVisit && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3.5 space-y-2.5 text-xs text-[#CBBEAB] overflow-hidden"
                        >
                          {siteVisits.filter(sv => sv.enquiryId === selectedEnquiryId).map(visit => {
                            const engineer = profiles.find(p => p.id === visit.engineerId);
                            return (
                              <div key={visit.id} className="p-2 border border-white/5 rounded-lg bg-black/40 text-left space-y-1 text-[10px]">
                                <div className="flex justify-between items-center">
                                  <span className="font-mono text-[9px] text-[#E6C27A]">{new Date(visit.scheduledAt).toLocaleDateString()}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider ${
                                    visit.status === 'Completed' ? 'bg-[#9BCF8A]/10 text-emerald-450 border border-[#9BCF8A]/20' : 'bg-[#D4A65A]/10 text-[#E6C27A] border border-[#D4A65A]/20'
                                  }`}>
                                    {visit.status}
                                  </span>
                                </div>
                                <div className="font-light text-[9.5px] text-[#CBBEAB]/85">Lead Inspector: <strong className="text-white font-medium">{engineer ? engineer.fullName : 'Engineer'}</strong></div>
                              </div>
                            );
                          })}
                          {siteVisits.filter(sv => sv.enquiryId === selectedEnquiryId).length === 0 && (
                            <span className="text-[10px] italic text-[#CBBEAB]/50 font-light block py-2">No visits logged.</span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* COLLAPSIBLE 5: Assigned Relationship designer */}
                  {assignedDesignerProfile && (
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-[#171717]/30">
                      <button
                        onClick={() => toggleSection('designer')}
                        className="w-full px-3 py-2.5 bg-[#171717]/60 flex items-center justify-between text-[10px] font-mono text-[#E6C27A] uppercase tracking-wider font-semibold hover:bg-[#171717]/90 transition-colors border-b border-white/5"
                      >
                        <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5" /> Sourcing Designer</span>
                        {expandedSections.designer ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      <AnimatePresence initial={false}>
                        {expandedSections.designer && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-3.5 text-xs text-[#CBBEAB] overflow-hidden"
                          >
                            <ProfileCard profile={assignedDesignerProfile} variant="flat" className="p-3 bg-black/40 border border-white/5 text-left" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* COLLAPSIBLE 6: Quick Actions */}
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-[#171717]/30">
                    <button
                      onClick={() => toggleSection('actions')}
                      className="w-full px-3 py-2.5 bg-[#171717]/60 flex items-center justify-between text-[10px] font-mono text-[#E6C27A] uppercase tracking-wider font-semibold hover:bg-[#171717]/90 transition-colors border-b border-white/5"
                    >
                      <span className="flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" /> Sourcing Actions</span>
                      {expandedSections.actions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedSections.actions && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3.5 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                              onClick={() => { setChannel('Email'); }}
                              className="py-1.5 px-2 rounded-lg bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9.5px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                            >
                              <Mail className="h-3.5 w-3.5" /> Email
                            </button>
                            <button
                              onClick={() => { setChannel('WhatsApp'); }}
                              className="py-1.5 px-2 rounded-lg bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9.5px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                            </button>
                            <button
                              onClick={() => setIsSchedulerOpen(true)}
                              className="py-1.5 px-2 rounded-lg bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9.5px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                            >
                              <Calendar className="h-3.5 w-3.5" /> Visit
                            </button>
                            <button
                              onClick={() => {
                                const approvedQuote = clientQuotations.find(q => q.status === 'Approved');
                                if (approvedQuote) {
                                  handleDownloadInvoice(approvedQuote, selectedEnquiry.clientName, selectedEnquiry.location);
                                } else {
                                  addToast('No Invoice Available', 'Approved quotation required to generate invoice PDF.', 'warning');
                                }
                              }}
                              className="py-1.5 px-2 rounded-lg bg-[#D4A65A]/10 hover:bg-[#D4A65A]/25 border border-[#D4A65A]/30 text-[9.5px] font-mono text-[#E6C27A] transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                            >
                              <Download className="h-3.5 w-3.5" /> Invoice
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="col-span-2 py-1.5 px-2 rounded-lg bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9.5px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print Sourcing Summary
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[#CBBEAB]/50 text-xs italic">
                Select active client to show profile cockpit details.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* OUTBOUND AUDIT LEDGER WORKSPACE */
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#050505]">
          <GlassCard hoverEffect={false} className="p-6 space-y-6 glass-premium-light border-[#D4A65A]/20 shadow-soft-luxe text-left">
            {/* Header / CSV export tool */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#D4A65A]/15 pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#8B7355] uppercase font-semibold">Outbound dispatch ledger</span>
                <h3 className="text-xl font-serif text-[#E6C27A] mt-0.5">Correspondence Audit Trail</h3>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black font-semibold font-mono text-xs uppercase tracking-wider shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Share2 className="h-4 w-4" /> Export CSV Sourcing
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-[#111111]/70 p-4 rounded-xl border border-white/5">
              <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8B7355]" />
                <input
                  type="text"
                  placeholder="Search dispatches by content..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#050505] text-white border border-[#D4A65A]/25 rounded-lg outline-none"
                  value={searchQueryAudits}
                  onChange={e => { setSearchQueryAudits(e.target.value); setAuditPage(1); }}
                />
              </div>

              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs cursor-pointer bg-[#050505] text-white border border-[#D4A65A]/20 rounded-lg outline-none"
                  value={logFilter}
                  onChange={e => { setLogFilter(e.target.value as any); setAuditPage(1); }}
                >
                  <option value="all">All Channels</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#D4A65A] pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs cursor-pointer bg-[#050505] text-white border border-[#D4A65A]/20 rounded-lg outline-none"
                  value={auditStatusFilter}
                  onChange={e => { setAuditStatusFilter(e.target.value as any); setAuditPage(1); }}
                >
                  <option value="all">All Statuses</option>
                  <option value="delivered">Delivered / Sent</option>
                  <option value="queued">Queued</option>
                  <option value="failed">Failed</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#D4A65A] pointer-events-none" />
              </div>
            </div>
            {/* Audit Table grid */}
            <div className="overflow-x-auto rounded-xl border border-[#D4A65A]/15 bg-[#050505]">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#D4A65A]/25 bg-[#111111] text-[#D4A65A] font-mono uppercase tracking-wider text-[9px]">
                    <th className="p-4">Client</th>
                    <th className="p-4 w-28 hidden sm:table-cell">Channel</th>
                    <th className="p-4">Subject / Dispatch Preview</th>
                    <th className="p-4 w-32">Status</th>
                    <th className="p-4 w-36 text-right font-mono hidden md:table-cell">Date</th>
                    <th className="p-4 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4A65A]/10 text-[#EAE3D8]">
                  {paginatedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#D4A65A]/2 transition-colors">
                      <td className="p-4 font-bold text-[#F5F1EA]">
                        <div>{log.clientName}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:hidden">
                          <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-mono uppercase font-bold tracking-wider ${
                            log.type === 'WhatsApp' 
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-950/40 text-[#E6C27A] border border-[#D4A65A]/20'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-[8px] text-[#CBBEAB]/50 font-mono">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider ${
                          log.type === 'WhatsApp' 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-950/40 text-[#E6C27A] border border-[#D4A65A]/20'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="p-4 max-w-[140px] sm:max-w-[280px] truncate text-[#CBBEAB]" title={log.content}>
                        {log.type === 'Email' ? (
                          <span>
                            <strong className="text-white mr-1">[Email]</strong> 
                            {log.subject} <span className="text-slate-500 text-[10px]">— {log.content}</span>
                          </span>
                        ) : log.content}
                      </td>
                      <td className="p-4 font-sans">
                        {log.status?.toLowerCase() === 'sent' || log.status?.toLowerCase() === 'delivered' ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold text-[9.5px]">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Delivered
                          </span>
                        ) : log.status === 'queued' ? (
                          <span className="text-amber-400 flex items-center gap-1 font-bold text-[9.5px]">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" /> Queued
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-rose-400 flex items-center gap-1 font-bold text-[9.5px]">
                              <AlertCircle className="h-3.5 w-3.5 text-rose-400" /> Failed
                            </span>
                            {log.type === 'WhatsApp' && (
                              <button
                                onClick={() => handleRetryWhatsApp(log.id, log.enquiryId)}
                                className="text-[8.5px] text-[#E6C27A] hover:underline flex items-center gap-0.5 font-bold cursor-pointer font-sans"
                              >
                                <RefreshCw className="h-2.5 w-2.5 animate-spin-hover" /> Retry
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right text-[#CBBEAB]/70 font-mono hidden md:table-cell">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        {log.type === 'Email' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedEmailForPreview(log.rawEmailLog)}
                            className="px-2.5 py-1 rounded bg-[#D4A65A]/10 hover:bg-[#D4A65A]/25 border border-[#D4A65A]/30 text-white font-mono text-[9px] tracking-wider uppercase font-bold cursor-pointer transition-colors"
                          >
                            Preview
                          </button>
                        ) : (
                          <span className="text-[9px] text-gray-600 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#CBBEAB]/50 text-xs italic">
                        No communication dispatch audits match active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalAuditPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs font-mono text-[#CBBEAB]">
                <span>Showing page {auditPage} of {totalAuditPages} ({unifiedLogs.length} total dispatches)</span>
                <div className="flex gap-2">
                  <Button
                    disabled={auditPage === 1}
                    onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                    variant="glass"
                    size="sm"
                    className="cursor-pointer font-mono"
                  >
                    Prev Page
                  </Button>
                  <Button
                    disabled={auditPage === totalAuditPages}
                    onClick={() => setAuditPage(prev => Math.min(prev + 1, totalAuditPages))}
                    variant="glass"
                    size="sm"
                    className="cursor-pointer font-mono"
                  >
                    Next Page
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* QUICK ACTION MODAL: Visit scheduler */}
      {isSchedulerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard hoverEffect={false} className="w-full max-w-md p-6 relative border border-[#D4A65A]/35 bg-[#111111] shadow-2xl text-left">
            <button
              onClick={() => setIsSchedulerOpen(false)}
              className="absolute top-4 right-4 text-[#CBBEAB] hover:text-white transition-colors cursor-pointer font-bold"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-serif text-[#D4A65A] mb-4 text-left border-b border-[#D4A65A]/20 pb-2.5">Schedule Site Visit</h2>
            
            <form onSubmit={handleScheduleVisit} className="space-y-4 text-left">
              <div>
                <label className="block text-[8.5px] font-mono tracking-wider text-[#8B7355] uppercase font-semibold mb-1">Inspector/Engineer *</label>
                <select
                  required
                  className="w-full bg-[#050505] border border-[#D4A65A]/25 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A65A] outline-none cursor-pointer"
                  value={selectedEngineerId}
                  onChange={e => setSelectedEngineerId(e.target.value)}
                >
                  <option value="" disabled>Select site engineer...</option>
                  {profiles.filter(p => p.role === 'Site Engineer').map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] font-mono tracking-wider text-[#8B7355] uppercase font-semibold mb-1">Scheduled Date & Time *</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full bg-[#050505] border border-[#D4A65A]/25 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A65A] outline-none"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[8.5px] font-mono tracking-wider text-[#8B7355] uppercase font-semibold mb-1">Scheduler Notes / Snags</label>
                <textarea
                  rows={3}
                  placeholder="Notes for inspection parameters or client requirements..."
                  className="w-full bg-[#050505] border border-[#D4A65A]/25 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A65A] outline-none resize-none font-sans"
                  value={schedulerNotes}
                  onChange={e => setSchedulerNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-5">
                <Button variant="ghost" type="button" onClick={() => setIsSchedulerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit" isLoading={isScheduling} className="bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black">
                  Schedule visit
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* EMAIL PREVIEW MODAL */}
      {selectedEmailForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard hoverEffect={false} className="w-full max-w-2xl p-6 relative border border-[#D4A65A]/35 bg-[#111111] shadow-2xl">
            <button
              onClick={() => setSelectedEmailForPreview(null)}
              className="absolute top-4 right-4 text-[#CBBEAB] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-[#D4A65A]/25 pb-4 mb-4 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8.5px] font-mono tracking-widest text-[#8B7355] uppercase font-semibold">Email Dispatch Log</span>
                  <h2 className="text-xl font-serif text-[#D4A65A] mt-1">{selectedEmailForPreview.subject}</h2>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider ${
                  selectedEmailForPreview.status === 'delivered' || selectedEmailForPreview.status === 'sent'
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                    : selectedEmailForPreview.status === 'queued'
                    ? 'bg-amber-950/40 text-amber-450 border border-amber-500/20'
                    : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                }`}>
                  {selectedEmailForPreview.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-[10px] text-[#CBBEAB] font-mono">
                <div>
                  <span className="text-white">From:</span> kanduririshik@gmail.com
                </div>
                <div>
                  <span className="text-white">To:</span> {selectedEmailForPreview.recipientEmail}
                </div>
                <div>
                  <span className="text-white">Sent Date:</span> {new Date(selectedEmailForPreview.sentAt || selectedEmailForPreview.createdAt).toLocaleString()}
                </div>
                {selectedEmailForPreview.messageId && (
                  <div className="truncate" title={selectedEmailForPreview.messageId}>
                    <span className="text-white">Message ID:</span> {selectedEmailForPreview.messageId}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden h-96">
              <iframe
                title="Email Preview Log"
                srcDoc={selectedEmailForPreview.body}
                className="w-full h-full border-none"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {selectedEmailForPreview.errorMessage && (
              <div className="mt-4 p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-450 text-[10px] font-mono text-left">
                <strong>Delivery Failure Details:</strong> {selectedEmailForPreview.errorMessage}
              </div>
            )}

            {selectedEmailForPreview.attachments && selectedEmailForPreview.attachments.length > 0 && (
              <div className="mt-4 text-left">
                <span className="text-[10px] font-semibold text-[#8B7355] uppercase tracking-wider block mb-2">Attachments ({selectedEmailForPreview.attachments.length})</span>
                <div className="flex flex-wrap gap-2">
                  {selectedEmailForPreview.attachments.map((att: any, idx: number) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[10px] text-[#EAE3D8] transition-all"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-[#D4A65A]" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <ExternalLink className="h-3 w-3 text-[#CBBEAB]" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedEmailForPreview(null)} variant="ghost" size="sm">
                Close Preview
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default CommunicationCenter;
