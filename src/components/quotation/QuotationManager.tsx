import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  Printer, 
  Check, 
  Trash, 
  Landmark, 
  FileCheck, 
  ShieldAlert,
  FileDown,
  Eye,
  Mail
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useNotifications } from '../../context/NotificationContext';
import { GlassCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { Quotation, QuotationItem, QuotationStatus } from '../../types';
import {
  useSimulatedPortalRole,
  useGlobalTeamFilter
} from '../../lib/assignments';
import { TeamSelector } from '../ui/TeamSelector';
import { ProfileCard } from '../ui/ProfileCard';
import { pdfService } from '../../services/pdfService';

export const QuotationManager: React.FC = () => {
  const {
    quotations,
    enquiries,
    createQuotation,
    updateQuotation,
    profiles,
    sendEmail,
    uploadDocument,
    emailTemplates
  } = useCRM();

  const { addToast } = useNotifications();

  // Sub Tab Control: 'quotations' | 'invoices'
  const [activeSubTab, setActiveSubTab] = useState<'quotations' | 'invoices'>('quotations');

  // Search & Filtering
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [portalRole] = useSimulatedPortalRole();
  const [globalFilter] = useGlobalTeamFilter();
  const [addAssignedConsultantId, setAddAssignedConsultantId] = useState('');

  // Set default consultant once profiles load
  useEffect(() => {
    if (profiles.length > 0 && !addAssignedConsultantId) {
      const defaultConsultant = profiles.find(p => p.role === 'Interior Designer') || profiles[0];
      setAddAssignedConsultantId(defaultConsultant.id);
    }
  }, [profiles, addAssignedConsultantId]);

  // Builder State
  const [builderEnquiryId, setBuilderEnquiryId] = useState('');
  const [builderItems, setBuilderItems] = useState<Omit<QuotationItem, 'id' | 'amount'>[]>([
    { description: 'Design layout & space blueprints', quantity: 1, unitPrice: 5000 }
  ]);
  const [taxRate] = useState(10); // 10% VAT/Luxury Tax

  // Filtered list based on live profiles and global filters
  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      const enquiry = enquiries.find(e => e.id === q.enquiryId);
      const clientName = enquiry?.clientName.toLowerCase() || '';

      const matchesSearch =
        q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
        clientName.includes(search.toLowerCase());

      const matchesStatus = filterStatus === 'all' || q.status === filterStatus;

      let matchesAssigned = true;
      if (portalRole !== 'Admin') {
        const consultant = profiles.find(p => p.id === q.consultantId);
        const linkedEnquiry = enquiries.find(e => e.id === q.enquiryId);
        const enquiryStaff = profiles.find(p => p.id === linkedEnquiry?.assignedStaffId);

        if (portalRole === 'Vendor Partner') {
          matchesAssigned = consultant?.role === 'Vendor Manager' || enquiryStaff?.role === 'Vendor Manager';
        } else {
          matchesAssigned = consultant?.role === portalRole || enquiryStaff?.role === portalRole;
        }
      } else if (globalFilter !== 'All') {
        const linkedEnquiry = enquiries.find(e => e.id === q.enquiryId);
        matchesAssigned = q.consultantId === globalFilter || linkedEnquiry?.assignedStaffId === globalFilter;
      }

      return matchesSearch && matchesStatus && matchesAssigned;
    });
  }, [quotations, enquiries, search, filterStatus, globalFilter, portalRole, profiles]);

  // Filtered Invoices list based on Approved Quotations
  const filteredInvoices = useMemo(() => {
    return quotations
      .filter(q => q.status === 'Approved')
      .filter(q => {
        const enquiry = enquiries.find(e => e.id === q.enquiryId);
        const clientName = enquiry?.clientName.toLowerCase() || '';
        const invoiceNumber = q.quotationNumber.replace('QT', 'INV');

        return (
          invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          clientName.includes(search.toLowerCase())
        );
      });
  }, [quotations, enquiries, search]);

  // Calculations for Builder
  const builderTotals = useMemo(() => {
    const subtotal = builderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [builderItems, taxRate]);

  // Add Item Line
  const handleAddItem = () => {
    setBuilderItems([...builderItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    setBuilderItems(builderItems.filter((_, i) => i !== index));
  };

  // Update Item Line
  const handleUpdateItem = (index: number, key: string, val: any) => {
    const updated = [...builderItems];
    updated[index] = { ...updated[index], [key]: val };
    setBuilderItems(updated);
  };

  // Submit Quote Builder
  const handleBuilderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderEnquiryId) {
      addToast('No client link', 'Please select a client account.', 'warning');
      return;
    }
    if (builderItems.some(i => !i.description.trim() || i.unitPrice <= 0)) {
      addToast('Invalid row items', 'Please fill item details and prices.', 'warning');
      return;
    }

    const mappedItems: QuotationItem[] = builderItems.map((item, idx) => ({
      id: `qi_${idx}_` + Math.random().toString(36).substr(2, 5),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice
    }));

    try {
      await createQuotation({
        enquiryId: builderEnquiryId,
        amount: builderTotals.total,
        status: 'Draft',
        items: mappedItems,
        consultantId: addAssignedConsultantId || undefined
      });

      setIsBuilderOpen(false);
      setBuilderEnquiryId('');
      setBuilderItems([{ description: 'Design layout & space blueprints', quantity: 1, unitPrice: 5000 }]);
      if (profiles.length > 0) {
        const defaultConsultant = profiles.find(p => p.role === 'Interior Designer') || profiles[0];
        setAddAssignedConsultantId(defaultConsultant.id);
      }
      addToast('Proposal Draft Completed', 'You can now finalize or send it.', 'success');
    } catch (err) {
      addToast('Failed to create draft', 'Check inputs.', 'error');
    }
  };

  // Change Status (Send, Approve, Reject)
  const handleStatusChange = async (quoteId: string, status: QuotationStatus) => {
    try {
      const updates: Partial<Quotation> = { status };
      if (status === 'Sent') {
        updates.sentAt = new Date().toISOString();
      }
      const updated = await updateQuotation(quoteId, updates);

      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote(updated);
      }
      addToast('Proposal Status Shifted', `Proposal status set to ${status}.`, 'success');
    } catch (err) {
      addToast('Failed status update', 'Check network settings.', 'error');
    }
  };

  // PDF Action Helpers
  const handleDownloadQuotation = (quote: Quotation) => {
    const enquiry = enquiries.find(e => e.id === quote.enquiryId);
    const consultant = profiles.find(p => p.id === quote.consultantId);
    const consultantName = consultant ? consultant.fullName : 'Glory Simon';

    const doc = pdfService.generateQuotationPDF(
      quote,
      enquiry?.clientName || 'Client',
      enquiry?.location || 'New York',
      consultantName
    );
    pdfService.download(doc, `${quote.quotationNumber}_Quotation.pdf`);
    addToast('PDF Downloaded', 'Quotation PDF has been saved.', 'success');
  };

  const handlePreviewQuotation = (quote: Quotation) => {
    const enquiry = enquiries.find(e => e.id === quote.enquiryId);
    const consultant = profiles.find(p => p.id === quote.consultantId);
    const consultantName = consultant ? consultant.fullName : 'Glory Simon';

    const doc = pdfService.generateQuotationPDF(
      quote,
      enquiry?.clientName || 'Client',
      enquiry?.location || 'New York',
      consultantName
    );
    const url = pdfService.preview(doc);
    window.open(url, '_blank');
  };

  const handleEmailQuotation = async (quote: Quotation) => {
    const enquiry = enquiries.find(e => e.id === quote.enquiryId);
    if (!enquiry) {
      addToast('Error', 'Client enquiry not found.', 'error');
      return;
    }

    setIsSendingEmail(true);
    addToast('Generating PDF...', 'Creating quotation PDF attachment.', 'info');

    try {
      const consultant = profiles.find(p => p.id === quote.consultantId);
      const consultantName = consultant ? consultant.fullName : 'Glory Simon';

      // 1. Generate jsPDF
      const doc = pdfService.generateQuotationPDF(quote, enquiry.clientName, enquiry.location, consultantName);
      
      // 2. Upload to Storage
      const blob = doc.output('blob');
      const filename = `${quote.quotationNumber}_Quotation.pdf`;
      addToast('Uploading PDF...', 'Saving document to Supabase storage.', 'info');
      const uploadedUrl = await uploadDocument(filename, blob);

      // 3. Get base64 string
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // 4. Fetch email template
      const tmpl = emailTemplates.find(t => t.id === 'quotation') || {
        subject: `Quotation {quotationNumber} from Glory Simon Interiors`,
        body: `Dear {clientName},\n\nPlease find attached our formal quotation {quotationNumber} totaling {amount} for your review.\n\nWarm regards,\nGlory Simon Interiors`
      };

      const parseText = (txt: string) => {
        return txt
          .replace(/{clientName}/g, enquiry.clientName)
          .replace(/{quotationNumber}/g, quote.quotationNumber)
          .replace(/{amount}/g, `₹${quote.amount.toLocaleString()}`)
          .replace(/{location}/g, enquiry.location || 'site');
      };

      const subject = parseText(tmpl.subject);
      const body = parseText(tmpl.body);

      // 5. Send Email
      addToast('Sending Email...', 'Dispatching via Gmail API.', 'info');
      const result = await sendEmail({
        enquiryId: quote.enquiryId,
        recipientEmail: enquiry.email,
        subject,
        body,
        emailType: 'Quotation Dispatch',
        attachments: [{
          name: filename,
          url: uploadedUrl,
          base64: pdfBase64,
          mimeType: 'application/pdf'
        }]
      });

      if (result.success) {
        addToast('Quotation Dispatched', `Email successfully sent to ${enquiry.clientName}.`, 'success');
        if (quote.status === 'Draft') {
          await handleStatusChange(quote.id, 'Sent');
        }
      } else {
        addToast('Dispatch Failed', result.errorMessage || 'Failed to dispatch email.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast('Dispatch Error', err.message || 'Error occurred while emailing.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadInvoice = (quote: Quotation) => {
    const enquiry = enquiries.find(e => e.id === quote.enquiryId);
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
      enquiry?.clientName || 'Client',
      enquiry?.location || 'New York',
      quote.amount,
      invoiceItems,
      consultantName,
      quote.updatedAt
    );
    pdfService.download(doc, `${invoiceNumber}_Invoice.pdf`);
    addToast('PDF Downloaded', 'Invoice PDF has been saved.', 'success');
  };

  const handlePreviewInvoice = (quote: Quotation) => {
    const enquiry = enquiries.find(e => e.id === quote.enquiryId);
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
      enquiry?.clientName || 'Client',
      enquiry?.location || 'New York',
      quote.amount,
      invoiceItems,
      consultantName,
      quote.updatedAt
    );
    const url = pdfService.preview(doc);
    window.open(url, '_blank');
  };

  const handleEmailInvoice = async (quote: Quotation) => {
    const enquiry = enquiries.find(e => e.id === quote.enquiryId);
    if (!enquiry) {
      addToast('Error', 'Client enquiry not found.', 'error');
      return;
    }

    setIsSendingEmail(true);
    addToast('Generating PDF...', 'Creating invoice PDF attachment.', 'info');

    try {
      const consultant = profiles.find(p => p.id === quote.consultantId);
      const consultantName = consultant ? consultant.fullName : 'Glory Simon';
      const invoiceNumber = quote.quotationNumber.replace('QT', 'INV');
      const invoiceItems = quote.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount
      }));

      // 1. Generate Invoice PDF
      const doc = pdfService.generateInvoicePDF(
        invoiceNumber,
        enquiry.clientName,
        enquiry.location,
        quote.amount,
        invoiceItems,
        consultantName,
        quote.updatedAt
      );

      // 2. Upload to Storage
      const blob = doc.output('blob');
      const filename = `${invoiceNumber}_Invoice.pdf`;
      addToast('Uploading PDF...', 'Saving document to Supabase storage.', 'info');
      const uploadedUrl = await uploadDocument(filename, blob);

      // 3. Get base64 string
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // 4. Fetch email template
      const tmpl = emailTemplates.find(t => t.id === 'invoice') || {
        subject: `Invoice {invoiceNumber} from Glory Simon Interiors`,
        body: `Dear {clientName},\n\nPlease find attached Invoice {invoiceNumber} for your project, totaling {amount}.\n\nWarm regards,\nGlory Simon Interiors`
      };

      const parseText = (txt: string) => {
        return txt
          .replace(/{clientName}/g, enquiry.clientName)
          .replace(/{invoiceNumber}/g, invoiceNumber)
          .replace(/{amount}/g, `₹${quote.amount.toLocaleString()}`)
          .replace(/{location}/g, enquiry.location || 'site');
      };

      const subject = parseText(tmpl.subject);
      const body = parseText(tmpl.body);

      // 5. Send Email
      addToast('Sending Email...', 'Dispatching via Gmail API.', 'info');
      const result = await sendEmail({
        enquiryId: quote.enquiryId,
        recipientEmail: enquiry.email,
        subject,
        body,
        emailType: 'Invoice Dispatch',
        attachments: [{
          name: filename,
          url: uploadedUrl,
          base64: pdfBase64,
          mimeType: 'application/pdf'
        }]
      });

      if (result.success) {
        addToast('Invoice Dispatched', `Email successfully sent to ${enquiry.clientName}.`, 'success');
      } else {
        addToast('Dispatch Failed', result.errorMessage || 'Failed to dispatch email.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast('Dispatch Error', err.message || 'Error occurred while emailing.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getClientName = (enquiryId: string) => {
    return enquiries.find(e => e.id === enquiryId)?.clientName || 'Unknown Client';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4A65A]/15 pb-4">
        <div>
          <span className="text-xxs tracking-widest text-[#8B7355] uppercase font-semibold font-display">financial dispatches</span>
          <h1 className="text-3xl font-serif font-medium text-[#D4A65A] tracking-tight mt-1">Quotations & Costs</h1>
        </div>
        <Button onClick={() => setIsBuilderOpen(true)} className="flex items-center gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" /> New Proposal
        </Button>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GlassCard hoverEffect={false} className="p-5 flex items-center justify-between border-l-4 border-[#D4A65A] glass-premium-light shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] block font-display tracking-widest uppercase font-semibold">Active proposals</span>
            <span className="text-2xl font-bold text-white font-mono mt-1.5 block">
              {quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length}
            </span>
          </div>
          <Landmark className="h-7 w-7 text-slate-500" />
        </GlassCard>

        <GlassCard hoverEffect={false} className="p-5 flex items-center justify-between border-l-4 border-[#4E7A65] glass-premium-light shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] block font-display tracking-widest uppercase font-semibold">Booked sourcing volume</span>
            <span className="text-2xl font-bold text-[#4E7A65] font-mono mt-1.5 block">
              ₹{quotations.filter(q => q.status === 'Approved').reduce((sum, q) => sum + q.amount, 0).toLocaleString()}
            </span>
          </div>
          <FileCheck className="h-7 w-7 text-[#4E7A65]/20" />
        </GlassCard>

        <GlassCard hoverEffect={false} className="p-5 flex items-center justify-between border-l-4 border-[#C76B4F] glass-premium-light shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] block font-display tracking-widest uppercase font-semibold">Revisions Requested</span>
            <span className="text-2xl font-bold text-[#C76B4F] font-mono mt-1.5 block">
              {quotations.filter(q => q.status === 'Rejected').length}
            </span>
          </div>
          <ShieldAlert className="h-7 w-7 text-[#C76B4F]/20" />
        </GlassCard>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex gap-2 border-b border-[#D4A65A]/15 pb-px mb-6">
        <button
          onClick={() => { setActiveSubTab('quotations'); setSearch(''); }}
          className={`px-4 py-2 border-b-2 text-xs font-display tracking-widest uppercase font-semibold transition-all cursor-pointer ${
            activeSubTab === 'quotations'
              ? 'border-[#D4A65A] text-[#E6C27A] bg-[#D4A65A]/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Quotations
        </button>
        <button
          onClick={() => { setActiveSubTab('invoices'); setSearch(''); }}
          className={`px-4 py-2 border-b-2 text-xs font-display tracking-widest uppercase font-semibold transition-all cursor-pointer ${
            activeSubTab === 'invoices'
              ? 'border-[#D4A65A] text-[#E6C27A] bg-[#D4A65A]/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Invoices
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 glass-premium-light p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'quotations' ? "Search proposals by Client..." : "Search invoices by Client..."}
            className="pl-10 pr-4 py-2 w-full glass-input-premium-light text-xs focus:border-[#D4A65A] outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {activeSubTab === 'quotations' && (
          <div className="relative w-full md:w-48">
            <select
              className="appearance-none pl-3 pr-8 py-2 w-full glass-input-premium-light text-xs cursor-pointer focus:border-[#D4A65A] outline-none bg-[#111111] text-white"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Proposals</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Grid List of Items */}
      {activeSubTab === 'quotations' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuotes.map(quote => {
            const clientName = getClientName(quote.enquiryId);
            const consultant = profiles.find(p => p.id === quote.consultantId);
            return (
              <GlassCard
                key={quote.id}
                hoverEffect={true}
                className="p-5 glass-premium-light space-y-4 cursor-pointer shadow-sm text-left relative group border border-white/5 hover:border-[#D4A65A]/50 transition-all duration-300"
                onClick={() => setSelectedQuote(quote)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400">{quote.quotationNumber}</span>
                    <h3 className="font-bold text-sm text-[#F5F1EA] line-clamp-1 font-display tracking-wide">{clientName}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${quote.status === 'Approved' ? 'bg-[#4E7A65]/10 text-[#9BCF8A] border border-[#4E7A65]/20 font-bold' :
                    quote.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      quote.status === 'Sent' ? 'bg-[#D4A65A]/15 text-[#E6C27A] border border-[#D4A65A]/25' :
                        'bg-slate-800 text-slate-400 border border-white/5'
                    }`}>
                    {quote.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400">
                  Consultant: <strong className="text-white font-medium">{consultant ? consultant.fullName : 'Unassigned'}</strong>
                </div>

                <div className="flex justify-between items-center pt-3.5 border-t border-white/5 text-xs text-slate-400 font-mono">
                  <span>{quote.items.length} Sourcing items</span>
                  <span className="font-sans font-bold text-[#D4A65A] text-base">₹{quote.amount.toLocaleString()}</span>
                </div>
              </GlassCard>
            );
          })}
          {filteredQuotes.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-display">
              No quotations found matching parameters.
            </div>
          )}
        </div>
      ) : (
        /* INVOICES LIST (Derived from Approved Quotations) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInvoices.map(quote => {
            const clientName = getClientName(quote.enquiryId);
            const consultant = profiles.find(p => p.id === quote.consultantId);
            const invoiceNumber = quote.quotationNumber.replace('QT', 'INV');
            return (
              <GlassCard
                key={quote.id}
                hoverEffect={false}
                className="p-5 glass-premium-light space-y-4 shadow-sm text-left border border-[#4E7A65]/20 hover:border-[#4E7A65] transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase font-semibold">{invoiceNumber}</span>
                    <h3 className="font-bold text-sm text-[#F5F1EA] line-clamp-1 font-display tracking-wide">{clientName}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-semibold uppercase bg-emerald-950/40 text-[#9BCF8A] border border-emerald-500/20">
                    due on receipt
                  </span>
                </div>

                <div className="text-[10px] text-slate-400">
                  Account Manager: <strong className="text-white font-medium">{consultant ? consultant.fullName : 'Glory Simon'}</strong>
                </div>

                <div className="flex justify-between items-center pt-3.5 border-t border-white/5 text-xs text-slate-400 font-mono">
                  <span>Sourcing Amount</span>
                  <span className="font-sans font-bold text-[#9BCF8A] text-base">₹{quote.amount.toLocaleString()}</span>
                </div>

                {/* Invoice Action Actions Row */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handlePreviewInvoice(quote)}
                    className="flex-1 py-1 px-2 rounded bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                    title="Preview Invoice"
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(quote)}
                    className="flex-1 py-1 px-2 rounded bg-black/40 hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[9px] font-mono text-[#CBBEAB] hover:text-[#D4A65A] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                    title="Download Invoice PDF"
                  >
                    <FileDown className="h-3 w-3" /> Download
                  </button>
                  <button
                    disabled={isSendingEmail}
                    onClick={() => handleEmailInvoice(quote)}
                    className="flex-1 py-1 px-2 rounded bg-[#4E7A65]/10 hover:bg-[#4E7A65]/20 border border-[#4E7A65]/30 text-[9px] font-mono text-[#9BCF8A] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wider disabled:opacity-50"
                    title="Email Invoice PDF"
                  >
                    <Mail className="h-3 w-3" /> Email
                  </button>
                </div>
              </GlassCard>
            );
          })}
          {filteredInvoices.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-display">
              No confirmed dispatches ready for invoicing.
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: BUILDER */}
      <Modal isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} title="Luxury Cost Estimator" size="lg">
        <form onSubmit={handleBuilderSubmit} className="space-y-5 font-display text-left">
          <div>
            <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Select client lead *</label>
            <select
              required
              className="w-full glass-input-premium-light text-xs cursor-pointer bg-[#141414] text-white focus:border-[#D4A65A] outline-none"
              value={builderEnquiryId}
              onChange={e => setBuilderEnquiryId(e.target.value)}
            >
              <option value="" disabled>Choose client account...</option>
              {enquiries
                .filter(e => e.status !== 'Lost')
                .map(e => (
                  <option key={e.id} value={e.id} className="bg-[#141414] text-white">{e.clientName} ({e.projectType})</option>
                ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Assigned Consultant *</label>
            <TeamSelector
              profiles={profiles}
              selectedId={addAssignedConsultantId}
              onChange={id => setAddAssignedConsultantId(id)}
              placeholder="Select consultant..."
            />
            {addAssignedConsultantId && (
              <div className="mt-3">
                <span className="text-[9px] text-[#8B7355] uppercase font-mono tracking-wider font-semibold block mb-1">Consultant Profile Preview</span>
                <ProfileCard profile={profiles.find(p => p.id === addAssignedConsultantId)} />
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xxs text-[#8B7355] uppercase tracking-wider font-semibold border-b border-white/5 pb-2 font-mono">
              <span>Sourcing cost ledger</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[#D4A65A] hover:underline flex items-center gap-1 cursor-pointer font-sans font-bold"
              >
                <Plus className="h-3 w-3" /> Add line
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 kanban-column-scroller">
              {builderItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input
                    required
                    type="text"
                    placeholder="Description (e.g. Carrara Marble Slab)"
                    className="flex-grow glass-input-premium-light text-xs bg-black/40 text-white"
                    value={item.description}
                    onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                  />
                  <input
                    required
                    type="number"
                    min={1}
                    placeholder="Qty"
                    className="w-16 glass-input-premium-light text-xs font-mono bg-black/40 text-white"
                    value={item.quantity}
                    onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                  />
                  <input
                    required
                    type="number"
                    min={0}
                    placeholder="Cost (₹)"
                    className="w-24 glass-input-premium-light text-xs font-mono bg-black/40 text-white"
                    value={item.unitPrice}
                    onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                  />
                  {builderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2.5 rounded-lg bg-rose-500/5 text-rose-600 hover:bg-rose-500/10 cursor-pointer border border-rose-200"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-luxury-bg-sec/50 border border-white/5 space-y-2 text-xs font-mono text-slate-400 text-right">
            <div>Subtotal: ₹{builderTotals.subtotal.toLocaleString()}</div>
            <div>Luxury Tax ({taxRate}%): ₹{builderTotals.tax.toLocaleString()}</div>
            <div className="text-base font-bold text-luxe-label pt-2.5 border-t border-white/5 font-display text-white">
              Total Sourcing Cost: ₹{builderTotals.total.toLocaleString()}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsBuilderOpen(false)}>Discard</Button>
            <Button variant="gold" type="submit">Draft Proposal</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: A4 PRINT DOCUMENT PREVIEW */}
      <Modal isOpen={!!selectedQuote} onClose={() => setSelectedQuote(null)} title="Proposal Ledger Document" size="xl">
        {selectedQuote && (
          <div className="space-y-6">
            {/* Tool Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="glass" onClick={handlePrint} className="flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider font-semibold">
                  <Printer className="h-4 w-4" /> Print Document
                </Button>
                
                {/* PDF generation tools */}
                <Button variant="glass" onClick={() => handlePreviewQuotation(selectedQuote)} className="flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider font-semibold">
                  <Eye className="h-4 w-4 text-[#D4A65A]" /> Preview PDF
                </Button>
                <Button variant="glass" onClick={() => handleDownloadQuotation(selectedQuote)} className="flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider font-semibold">
                  <FileDown className="h-4 w-4 text-[#D4A65A]" /> Download PDF
                </Button>
                <Button variant="glass" disabled={isSendingEmail} onClick={() => handleEmailQuotation(selectedQuote)} className="flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider font-semibold">
                  <Mail className="h-4 w-4 text-[#D4A65A]" /> Email PDF
                </Button>

                {selectedQuote.status === 'Draft' && (
                  <Button variant="gold" onClick={() => handleStatusChange(selectedQuote.id, 'Sent')} className="flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider font-semibold">
                    <Check className="h-4 w-4" /> Finalize & Send
                  </Button>
                )}
                
                <div className="flex items-center gap-2 bg-[#141414] border border-[#D4A65A]/25 rounded px-2.5 py-1.5 text-xxs font-bold text-white">
                  <span className="text-slate-400">Consultant:</span>
                  <select
                    className="bg-transparent border-none text-white font-bold cursor-pointer focus:outline-none p-0 text-xxs"
                    value={selectedQuote.consultantId || ''}
                    onChange={async (e) => {
                      const newConsultantId = e.target.value;
                      try {
                        const updated = await updateQuotation(selectedQuote.id, { consultantId: newConsultantId });
                        setSelectedQuote(updated);
                        addToast('Consultant Reassigned', 'The proposal has been updated with the new consultant.', 'success');
                      } catch (err: any) {
                        addToast('Reassignment failed', err?.message || 'Check database connection.', 'error');
                      }
                    }}
                  >
                    <option value="" disabled>Select Consultant...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#141414] text-white">{p.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedQuote.status === 'Sent' && (
                <div className="flex gap-2">
                  <Button variant="gold" className="text-xs uppercase tracking-wider font-semibold" onClick={() => handleStatusChange(selectedQuote.id, 'Approved')}>
                    Approve proposal
                  </Button>
                  <Button variant="danger" className="text-xs" onClick={() => handleStatusChange(selectedQuote.id, 'Rejected')}>
                    Request revision
                  </Button>
                </div>
              )}
            </div>

            {selectedQuote.consultantId && (
              <div className="max-w-2xl mx-auto mb-4 text-left">
                <span className="text-[9px] text-[#8B7355] uppercase font-mono tracking-wider font-semibold block mb-1">Consultant Profile Details</span>
                <ProfileCard profile={profiles.find(p => p.id === selectedQuote.consultantId)} />
              </div>
            )}

            {/* Document sheet */}
            <div id="print-area" className="bg-[#fcfbf9] text-slate-900 p-10 rounded-2xl max-w-2xl mx-auto shadow-2xl border border-slate-300/60 font-sans text-left">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl font-serif font-bold uppercase tracking-wider text-slate-800">Glory Simon Interiors</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Luxury Architectural Spaces</p>
                  <p className="text-[10px] text-slate-400 mt-2">Level 12, Manhattan Design Center, NY</p>
                </div>
                <div className="text-right">
                  <h2 className="text-base font-semibold tracking-widest text-slate-500 uppercase">PROPOSAL</h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Ledger: {selectedQuote.quotationNumber}</p>
                  <p className="text-xs text-slate-400 font-mono">Date: {new Date(selectedQuote.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Sourcing clients info */}
              <div className="my-8 grid grid-cols-3 gap-4 text-xs font-display">
                <div>
                  <span className="font-semibold text-slate-400 block tracking-wider text-[10px] uppercase">PREPARED FOR:</span>
                  <span className="font-bold text-slate-800 text-sm mt-1.5 block">{getClientName(selectedQuote.enquiryId)}</span>
                  <span className="text-slate-500 mt-1 block">{enquiries.find(e => e.id === selectedQuote.enquiryId)?.location}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block tracking-wider text-[10px] uppercase">CONSULTANT:</span>
                  <span className="font-bold text-slate-800 text-sm mt-1.5 block">
                    {profiles.find(p => p.id === selectedQuote.consultantId)?.fullName || 'Unassigned'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-400 block tracking-wider text-[10px] uppercase">STATUS:</span>
                  <span className="font-bold text-xs mt-1.5 block uppercase text-slate-800">{selectedQuote.status}</span>
                </div>
              </div>

              {/* Ledger items */}
              <table className="w-full text-left text-xs border-collapse mt-8">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                    <th className="py-2.5">Line Specification</th>
                    <th className="py-2.5 text-center w-14">Qty</th>
                    <th className="py-2.5 text-right w-24">Unit Cost</th>
                    <th className="py-2.5 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-light">
                  {selectedQuote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3.5 font-medium text-slate-800">{item.description}</td>
                      <td className="py-3.5 text-center">{item.quantity}</td>
                      <td className="py-3.5 text-right font-mono">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-3.5 text-right font-semibold font-mono text-slate-800">
                        ₹{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sourcing totals */}
              <div className="mt-8 border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-64 text-right space-y-2.5 text-xs font-mono text-slate-500">
                  <div className="flex justify-between">
                    <span>Sourcing Subtotal:</span>
                    <span>₹{Math.round(selectedQuote.amount / 1.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Luxury Tax (10%):</span>
                    <span>₹{Math.round(selectedQuote.amount - (selectedQuote.amount / 1.1)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2 font-sans">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{selectedQuote.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Sourcing Terms */}
              <div className="mt-12 pt-6 border-t border-slate-100 text-[9px] text-slate-400 leading-relaxed font-mono">
                <span className="font-bold text-slate-600 block mb-1">PROPOSAL CONDITIONS:</span>
                <p>
                  1. A 40% retainer payment is required to activate space modeling and material quarry locks.<br />
                  2. Sourcing quotes are valid for 30 calendar days from ledger dispatch date.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuotationManager;
