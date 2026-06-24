import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  MessageSquare,
  Sparkles,
  Clock,
  CheckCircle,
  Briefcase,
  Cpu,
  ChevronDown,
  Layers,
  X,
  Paperclip,
  ExternalLink,
  Eye
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAI } from '../../context/AIContext';
import { useNotifications } from '../../context/NotificationContext';
import { GlassCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { AIOrb } from '../ui/AIOrb';
import type { StatusHistory, SiteVisit, Quotation, PreferredStyle, CommunicationLog } from '../../types';

export const ClientDetail: React.FC<{
  onBack: () => void;
  onNavigate: (tab: string) => void;
}> = ({ onBack, onNavigate }) => {
  const { 
    selectedEnquiryId, 
    enquiries, 
    profiles, 
    updateEnquiry,
    getStatusHistory,
    getCommunications,
    siteVisits,
    quotations,
    emailLogs
  } = useCRM();

  const { 
    runSummarizer, 
    runLeadScoring, 
    runSuggestions, 
    runFollowUpGenerator,
    streamText
  } = useAI();

  const { addToast } = useNotifications();

  // Find active enquiry
  const enquiry = enquiries.find(e => e.id === selectedEnquiryId);

  // Tab Control: 'deck' (Presentation) | 'timeline' | 'visits' | 'quotes' | 'comms' | 'ai'
  const [activeTab, setActiveTab] = useState<'deck' | 'timeline' | 'visits' | 'quotes' | 'comms' | 'ai'>('deck');

  // Logs States
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [comms, setComms] = useState<CommunicationLog[]>([]);
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<any>(null);
  
  // Streaming state for AI results
  const [streamedText, setStreamedText] = useState<string>('');
  const [activeAiOutput, setActiveAiOutput] = useState<any>(null);
  const [activeAiType, setActiveAiType] = useState<string | null>(null);

  // Load related documents
  const loadEnquiryDetails = async () => {
    if (!selectedEnquiryId) return;
    try {
      const results = await Promise.allSettled([
        getStatusHistory(selectedEnquiryId),
        getCommunications(selectedEnquiryId)
      ]);
      
      if (results[0].status === 'fulfilled') {
        setHistory(results[0].value);
      } else {
        console.error('[ClientDetail] Failed to load status history', results[0].reason);
        setHistory([]);
      }

      if (results[1].status === 'fulfilled') {
        setComms(results[1].value);
      } else {
        console.error('[ClientDetail] Failed to load communications', results[1].reason);
        setComms([]);
      }
      
      const filteredVisits = siteVisits.filter(v => v.enquiryId === selectedEnquiryId);
      const filteredQuotes = quotations.filter(q => q.enquiryId === selectedEnquiryId);
      setVisits(filteredVisits);
      setQuotes(filteredQuotes);
    } catch (e) {
      console.error('[ClientDetail] Critical error in loadEnquiryDetails', e);
    }
  };

  useEffect(() => {
    loadEnquiryDetails();
  }, [selectedEnquiryId, enquiries, siteVisits, quotations]);

  // Unified list of logs (WhatsApp + Email logs combined)
  const clientCommunications = useMemo(() => {
    const whatsapp = comms.map(c => ({
      id: c.id,
      type: 'WhatsApp' as const,
      subject: '',
      content: c.content,
      status: c.status,
      createdAt: c.createdAt,
      attachments: [] as any[],
      errorMessage: c.errorMessage,
      templateName: c.templateName
    }));

    const emails = emailLogs
      .filter(log => log.enquiryId === selectedEnquiryId)
      .map(log => ({
        id: log.id,
        type: 'Email' as const,
        subject: log.subject,
        content: log.body,
        status: log.status === 'delivered' || log.status === 'sent' ? 'Delivered' as const : log.status === 'failed' ? 'Failed' as const : 'Sent' as const,
        createdAt: log.createdAt,
        attachments: log.attachments || [],
        errorMessage: log.errorMessage,
        templateName: log.emailType,
        rawEmailLog: log
      }));

    return [...whatsapp, ...emails].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [comms, emailLogs, selectedEnquiryId]);

  // Concept style mockup images mapping
  const conceptStyleImages: Record<PreferredStyle, string> = {
    Luxury: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
    Traditional: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&auto=format&fit=crop&q=80',
    Modern: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&auto=format&fit=crop&q=80',
    Minimalist: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
    Contemporary: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80'
  };

  // Dynamic Moodboard materials based on style selection
  const styleMoodboards: Record<PreferredStyle, { name: string; type: string; details: string; bg: string }[]> = {
    Luxury: [
      { name: 'Calacatta Gold', type: 'Polished Marble', details: 'Carrara import, gold vein highlights', bg: 'linear-gradient(135deg, #FFF 60%, #E3C185 85%, #BFA572 100%)' },
      { name: 'Royal Walnut', type: 'Satin Lacquer Wood', details: 'Deep dark grain, matte wax seal', bg: 'bg-[#4d3a2a]' },
      { name: 'Silk Velvet', type: 'Drapery & Pillows', details: 'Aged bronze hue fabric texture', bg: 'bg-[#6b5b43]' },
      { name: 'Champagne Satin', type: 'Hardware Metal', details: 'Brushed copper metallic fittings', bg: 'bg-[#F6E7C1]' }
    ],
    Minimalist: [
      { name: 'Bleached Ash', type: 'White Wash Wood', details: 'Scandinavian clean grain, natural wax', bg: 'bg-[#d6c7b6]' },
      { name: 'Raw Limestone', type: 'Unpolished Stone', details: 'Matte tile flooring texture', bg: 'bg-[#e5dcd3]' },
      { name: 'Belgian Linen', type: 'Sofas & Sheers', details: 'Ivory basket-weave textured cloth', bg: 'bg-[#e3dac9]' },
      { name: 'Aged Bronze', type: 'Metal Accent', details: 'Hardware and structural frames', bg: 'bg-[#8B7355]' }
    ],
    Modern: [
      { name: 'Nero Marquina', type: 'Polished Marble', details: 'Basque Country slate with white veins', bg: 'linear-gradient(135deg, #1A1A1A 70%, #FFF 80%, #1A1A1A 90%)' },
      { name: 'Honey Teak', type: 'Natural Oil Wood', details: 'Warm golden grain structural board', bg: 'bg-[#805a36]' },
      { name: 'Italian Saddle Leather', type: 'Upholstery Seating', details: 'Tan brown hide chair finish', bg: 'bg-[#915f38]' },
      { name: 'Architectural Spots', type: 'Spotlights', details: '2700K high CRI light clusters', bg: 'bg-[#D4A65A]/40 border border-[#D4A65A]/30' }
    ],
    Traditional: [
      { name: 'Rosa Portogallo', type: 'Honed Marble', details: 'Soft pink tint, portuguese quarry', bg: 'linear-gradient(135deg, #fcece6 40%, #D99A6C 75%, #FFF 100%)' },
      { name: 'Smoked Oak', type: 'Brushed Matt Wood', details: 'Dark coffee grain decorative woodwork', bg: 'bg-[#3b2f2f]' },
      { name: 'Chunky Bouclé', type: 'Upholstery Fabric', details: 'Champagne textured wool loops', bg: 'bg-[#ebdcd0]' },
      { name: 'Murano Glass', type: 'Bespoke Lighting', details: 'Handblown crystal amber fixtures', bg: 'bg-gradient-to-tr from-yellow-200 to-[#111111]' }
    ],
    Contemporary: [
      { name: 'Verde Alpi', type: 'Polished Marble', details: 'Forest green deep alpine marble slabs', bg: 'linear-gradient(135deg, #1e3a2f 50%, #4E7A65 80%, #0f1d18 100%)' },
      { name: 'Honey Teak', type: 'Natural Oil Wood', details: 'Warm golden grain structural board', bg: 'bg-[#805a36]' },
      { name: 'Belgian Linen', type: 'Sofas & Sheers', details: 'Ivory basket-weave textured cloth', bg: 'bg-[#e3dac9]' },
      { name: 'Aged Bronze', type: 'Metal Accent', details: 'Hardware and structural frames', bg: 'bg-[#8B7355]' }
    ]
  };

  // Find Assigned Staff
  const staff = profiles.find(p => p.id === enquiry?.assignedStaffId);

  if (!enquiry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#CBBEAB] gap-4">
        <p className="text-sm font-display">No client profile selected.</p>
        <Button onClick={onBack}>Return to Portfolio</Button>
      </div>
    );
  }

  // Trigger AI analysis and stream results
  const handleTriggerAI = async (type: 'summarizer' | 'scoring' | 'suggestions' | 'follow_up') => {
    setActiveAiType(type);
    setStreamedText('');
    setActiveAiOutput(null);
    
    try {
      let result;
      if (type === 'summarizer') {
        result = await runSummarizer(enquiry.id);
        const textToStream = `[Summary report generated for ${enquiry.clientName}]\n\n${result.response.summary}\n\nKEY REQUISITIONS:\n• ${result.response.keyDemands.join('\n• ')}`;
        await streamText(textToStream, setStreamedText);
      } else if (type === 'scoring') {
        result = await runLeadScoring(enquiry.id);
        const textToStream = `[Lead Scoring Analysis]\nCONFIDENCE METRIC: ${result.response.leadScore}/100\nCONVERSION CHANCE: ${result.response.conversionProbability}%\n\nNEXT PROTOCOL ACTION:\n${result.response.recommendedNextAction}`;
        await streamText(textToStream, setStreamedText);
      } else if (type === 'suggestions') {
        result = await runSuggestions(enquiry.id);
        const textToStream = `[Design Concept Proposals]\nSUB-STYLE MATRICES:\n• ${result.response.suggestedSubStyles.join('\n• ')}\n\nMATERIAL MATRICES:\n• ${result.response.recommendedMaterials.join('\n• ')}`;
        await streamText(textToStream, setStreamedText);
      } else if (type === 'follow_up') {
        result = await runFollowUpGenerator(enquiry.id);
        const textToStream = `[Outbound Follow-Up Script]\n"${result.response.welcome}"`;
        await streamText(textToStream, setStreamedText);
      }
      
      setActiveAiOutput(result?.response);
      addToast('Neural Matrix Loaded', 'AI details completed.', 'success');
    } catch (e) {
      addToast('AI Processing Interrupted', 'Please try again.', 'error');
    }
  };

  const itemFade = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 18 } }
  };

  const activeMoodboard = styleMoodboards[enquiry.preferredStyle] || styleMoodboards.Luxury;

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 md:px-8 py-12 text-[#EAE3D8] font-sans">
      
      {/* 1. Cinematic Presentation Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D4A65A]/15 pb-6">
        <div className="space-y-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[#8B7355] hover:text-[#E6C27A] transition-colors group cursor-pointer font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> Sourcing Registry
          </button>
          
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4A65A]/10 text-[#E6C27A] border border-[#D4A65A]/25 text-[9px] font-semibold font-mono uppercase tracking-wider">
              {enquiry.status}
            </span>
            <h1 className="text-4xl font-serif font-medium text-[#F5F1EA] tracking-tight">{enquiry.clientName}</h1>
            <p className="text-xs text-[#CBBEAB] font-display uppercase tracking-widest font-semibold">{enquiry.companyName || 'Private Account'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2 bg-[#111111] border border-[#D4A65A]/25 text-[#F5F1EA] text-xs font-display cursor-pointer rounded-xl focus:ring-1 focus:ring-[#D4A65A] focus:border-[#D4A65A]"
              value={enquiry.status}
              onChange={async (e) => {
                await updateEnquiry(enquiry.id, { status: e.target.value as any });
                addToast('Workflow Shifted', `Updated ${enquiry.clientName} status to ${e.target.value}`, 'success');
              }}
            >
              <option value="New Lead">New Lead</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Site Visit Scheduled">Site Visit Scheduled</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Lost">Lost</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-[#D4A65A] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Apple Presentation Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Sidebar: Sourcing Parameters & Overview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Overview */}
          <GlassCard hoverEffect={false} className="p-6 space-y-5 bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe text-[#EAE3D8]">
            <h3 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">Client Overview</h3>
            
            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-center gap-3 text-[#EAE3D8]">
                <span className="p-1.5 rounded-lg bg-[#171717] border border-[#D4A65A]/20"><Phone className="h-3.5 w-3.5 text-[#D4A65A]" /></span>
                <span>{enquiry.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-[#EAE3D8]">
                <span className="p-1.5 rounded-lg bg-[#171717] border border-[#D4A65A]/20"><Mail className="h-3.5 w-3.5 text-[#D4A65A]" /></span>
                <a href={`mailto:${enquiry.email}`} className="hover:underline truncate text-[#EAE3D8]">{enquiry.email || 'N/A'}</a>
              </div>
              <div className="flex items-center gap-3 text-[#EAE3D8]">
                <span className="p-1.5 rounded-lg bg-[#171717] border border-[#D4A65A]/20"><MapPin className="h-3.5 w-3.5 text-[#D4A65A]" /></span>
                <span className="truncate">{enquiry.location}</span>
              </div>
            </div>
          </GlassCard>

          {/* Card 2: Metrics */}
          <GlassCard hoverEffect={false} className="p-6 space-y-5 bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe text-[#EAE3D8]">
            <h3 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">Project Dimensions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#171717] rounded-xl border border-[#D4A65A]/20">
                <span className="text-[9px] text-[#CBBEAB] block uppercase font-mono tracking-wider font-semibold">Budget Limit</span>
                <span className="text-base font-bold text-white mt-1 block font-mono">₹{enquiry.budget.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-[#171717] rounded-xl border border-[#D4A65A]/20">
                <span className="text-[9px] text-[#CBBEAB] block uppercase font-mono tracking-wider font-semibold">Area footprint</span>
                <span className="text-base font-bold text-white mt-1 block font-mono">{enquiry.sqFtArea} Sq Ft</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-[#EAE3D8]">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[#CBBEAB]">Typology:</span>
                <span className="text-white font-semibold">{enquiry.projectType}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[#CBBEAB]">Style Preference:</span>
                <span className="text-[#E6C27A] font-semibold">{enquiry.preferredStyle}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[#CBBEAB]">Lead Source:</span>
                <span className="text-white font-semibold">{enquiry.leadSource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#CBBEAB]">Registration Date:</span>
                <span className="text-[#CBBEAB] font-mono">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </GlassCard>

          {/* Card 3: Designer Assigned */}
          <GlassCard hoverEffect={false} className="p-6 space-y-4 bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe text-[#EAE3D8]">
            <h3 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">Design Partner</h3>
            {staff ? (
              <div className="flex items-center gap-3">
                <img src={staff.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60'} alt={staff.fullName} className="h-10 w-10 rounded-full border border-[#D4A65A]/25 object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{staff.fullName}</h4>
                  <p className="text-[10px] text-[#CBBEAB] font-mono uppercase tracking-wider mt-0.5">{staff.roleTitle || staff.role}</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#CBBEAB] italic">No designer assigned.</div>
            )}
          </GlassCard>
        </div>

        {/* Right Area: Presentation Tabs & Content */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-[#D4A65A]/15 gap-2 overflow-x-auto pb-px font-display text-xs tracking-widest uppercase font-semibold">
            {[
              { id: 'deck', label: 'Presentation Deck', icon: <Layers className="h-3.5 w-3.5" /> },
              { id: 'timeline', label: 'Timeline Thread', icon: <Clock className="h-3.5 w-3.5" /> },
              { id: 'visits', label: 'Inspections', icon: <Calendar className="h-3.5 w-3.5" /> },
              { id: 'quotes', label: 'Quotations', icon: <FileText className="h-3.5 w-3.5" /> },
              { id: 'comms', label: 'Correspondence', icon: <MessageSquare className="h-3.5 w-3.5" /> },
              { id: 'ai', label: 'AI Sourcing Desk', icon: <Sparkles className="h-3.5 w-3.5 text-[#E6C27A]" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setStreamedText('');
                  setActiveAiOutput(null);
                  setActiveAiType(null);
                }}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-[#D4A65A] text-[#E6C27A] font-semibold bg-[#D4A65A]/10 rounded-t-2xl' 
                    : 'border-transparent text-[#CBBEAB] hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {/* 1. PRESENTATION DECK */}
            {activeTab === 'deck' && (
              <motion.div initial="hidden" animate="show" variants={itemFade} className="space-y-6">
                {/* Full-width Concept Hero Banner */}
                <div className="relative h-64 rounded-3xl overflow-hidden shadow-soft-luxe border border-[#D4A65A]/10">
                  <img 
                    src={conceptStyleImages[enquiry.preferredStyle]} 
                    alt={enquiry.preferredStyle} 
                    className="w-full h-full object-cover brightness-[80%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white space-y-1">
                    <span className="text-[9px] font-mono tracking-widest text-[#E6C27A] uppercase block font-semibold">Active Concept Aesthetic</span>
                    <h3 className="text-xl font-serif text-white tracking-wide">{enquiry.preferredStyle} Interior Sourcing</h3>
                  </div>
                </div>

                {/* Sourcing requirements description block */}
                <GlassCard hoverEffect={false} className="p-6 bg-[#111111] border-[#D4A65A]/15 shadow-soft-luxe">
                  <h4 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display mb-3 border-b border-[#D4A65A]/15 pb-2">
                    Client Design Mandates
                  </h4>
                  <p className="text-[#EAE3D8] text-xs leading-relaxed whitespace-pre-line font-light">
                    {enquiry.requirements || 'No scope directives specified.'}
                  </p>
                </GlassCard>

                {/* Dynamic Material Moodboard Grid */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display block">
                    Material Moodboard Grid
                  </span>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeMoodboard.map((item, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#D4A65A]/10 p-3 flex flex-col justify-between h-36 bg-[#171717] shadow-sm hover:border-[#D4A65A]/35 transition-all duration-500 group">
                        <div className={`h-16 w-full rounded-xl transition-transform duration-500 group-hover:scale-105 shadow-inner ${item.bg}`} style={{ background: item.bg.startsWith('linear') ? item.bg : undefined }} />
                        <div className="mt-2 text-left">
                          <span className="text-[7.5px] text-[#CBBEAB] font-mono uppercase block">{item.type}</span>
                          <span className="text-[10.5px] font-serif font-bold text-white block mt-0.5 leading-none">{item.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. TIMELINE HISTORY */}
            {activeTab === 'timeline' && (
              <motion.div initial="hidden" animate="show" variants={itemFade} className="space-y-6">
                <div className="relative pl-6 border-l border-[#D4A65A]/30 space-y-6 ml-2.5 pt-2">
                  {history.map((sh, index) => {
                    const executor = profiles.find(p => p.id === sh.changedById);
                    return (
                      <div key={sh.id} className="relative">
                        {/* Glowing node */}
                        <div className={`absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-[#050505] ${
                          index === 0 ? 'bg-[#D4A65A] shadow-[0_0_8px_rgba(212,166,90,0.6)]' : 'bg-slate-700'
                        }`} />
                        
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white font-display">
                              Status Shifted: <span className="text-[#E6C27A]">{sh.newStatus}</span>
                            </span>
                            <span className="text-[#CBBEAB] font-mono text-[9px]">
                              {new Date(sh.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {sh.oldStatus && (
                            <p className="text-[9px] text-[#CBBEAB] font-mono">Previous Stage: {sh.oldStatus}</p>
                          )}
                          <p className="text-[#EAE3D8] text-xs leading-relaxed bg-[#171717]/40 p-3.5 rounded-2xl border border-[#D4A65A]/15 font-light">
                            {sh.notes}
                          </p>
                          {executor && (
                            <span className="text-[8px] text-[#CBBEAB] font-mono block">Operator: {executor.fullName} ({executor.roleTitle || executor.role})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 3. SITE VISITS */}
            {activeTab === 'visits' && (
              <motion.div initial="hidden" animate="show" variants={itemFade} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display">Inspections Ledger</h4>
                  <Button size="sm" variant="glass" onClick={() => onNavigate('scheduler')} className="flex items-center gap-1.5 text-xxs tracking-wider uppercase font-semibold border border-[#D4A65A]/20">
                    <Calendar className="h-3.5 w-3.5 text-[#D4A65A]" /> Book Inspection
                  </Button>
                </div>
                
                {visits.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visits.map(v => (
                      <GlassCard key={v.id} hoverEffect={true} className="p-4 bg-[#171717] border border-[#D4A65A]/15 space-y-3 shadow-sm hover:border-[#D4A65A]/35 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono text-[#CBBEAB]">
                            {new Date(v.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[8px] font-semibold bg-[#D4A65A]/10 text-[#E6C27A] border border-[#D4A65A]/25 font-mono uppercase">
                            {v.status}
                          </span>
                        </div>
                        <p className="text-[#EAE3D8] text-xs leading-relaxed font-light">{v.notes || 'Routine Site Assessment.'}</p>
                        <div className="flex items-center gap-2 pt-2.5 border-t border-white/5 text-[8px] text-[#CBBEAB] font-mono">
                          <Briefcase className="h-3 w-3 text-[#D4A65A]" />
                          <span>Engineer: {profiles.find(p => p.id === v.engineerId)?.fullName || 'Unassigned'}</span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 border border-dashed border-[#D4A65A]/20 rounded-2xl flex items-center justify-center text-[#CBBEAB] text-xs font-display">
                    No physical site visits logged.
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. QUOTATIONS */}
            {activeTab === 'quotes' && (
              <motion.div initial="hidden" animate="show" variants={itemFade} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display">Financial Proposals</h4>
                  <Button size="sm" variant="glass" onClick={() => onNavigate('quotations')} className="flex items-center gap-1.5 text-xxs tracking-wider uppercase font-semibold border border-[#D4A65A]/20">
                    <FileText className="h-3.5 w-3.5 text-[#D4A65A]" /> Compose Proposal
                  </Button>
                </div>
                
                {quotes.length > 0 ? (
                  <div className="space-y-3">
                    {quotes.map(q => (
                      <GlassCard 
                        key={q.id}
                        hoverEffect={true} 
                        onClick={() => onNavigate('quotations')}
                        className="p-4 bg-[#171717] border border-[#D4A65A]/15 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#D4A65A]/35 shadow-sm text-left"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white font-mono">{q.quotationNumber}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${
                              q.status === 'Approved' ? 'bg-[#4E7A65]/10 text-[#9BCF8A] border border-[#4E7A65]/20 font-semibold' :
                              q.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              'bg-[#1A1A1A] text-[#CBBEAB] border border-[#D4A65A]/15'
                            }`}>
                              {q.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-[#CBBEAB] font-mono">Date: {new Date(q.createdAt).toLocaleDateString()} • {q.items.length} items</p>
                        </div>
                        <div className="font-mono text-sm font-semibold text-[#D4A65A]">₹{q.amount.toLocaleString()}</div>
                      </GlassCard>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 border border-dashed border-[#D4A65A]/20 rounded-2xl flex items-center justify-center text-[#CBBEAB] text-xs font-display">
                    No quotations drafted.
                  </div>
                )}
              </motion.div>
            )}

            {/* 5. COMMUNICATIONS */}
            {activeTab === 'comms' && (
              <motion.div initial="hidden" animate="show" variants={itemFade} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display">Interaction Archives</h4>
                  <Button size="sm" variant="glass" onClick={() => onNavigate('communication')} className="flex items-center gap-1.5 text-xxs tracking-wider uppercase font-semibold border border-[#D4A65A]/20">
                    <MessageSquare className="h-3.5 w-3.5 text-[#D4A65A]" /> Send Dispatch
                  </Button>
                </div>
                
                {clientCommunications.length > 0 ? (
                  <div className="space-y-3">
                    {clientCommunications.map((c: any) => (
                      <GlassCard key={c.id} hoverEffect={false} className="p-4 bg-[#171717] border border-[#D4A65A]/15 shadow-sm text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-semibold font-mono uppercase ${
                            c.type === 'WhatsApp' ? 'bg-[#4E7A65]/10 text-[#9BCF8A] border border-[#4E7A65]/20' : 'bg-blue-900/20 text-blue-400 border border-blue-900/30'
                          }`}>
                            {c.type}
                          </span>
                          <span className="text-[9px] text-[#CBBEAB] font-mono">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {c.type === 'Email' && (
                          <div className="flex items-center gap-1.5 border-b border-[#D4A65A]/15 pb-1.5 mb-1.5 text-[10px] text-[#CBBEAB] font-mono">
                            <Mail className="h-3 w-3 text-[#D4A65A]" />
                            <span className="text-white font-medium">Subject:</span>
                            <span className="truncate max-w-[200px] font-semibold text-white">{c.subject}</span>
                            
                            <button
                              type="button"
                              onClick={() => setSelectedEmailForPreview(c.rawEmailLog)}
                              className="ml-auto p-0.5 rounded bg-[#D4A65A]/10 hover:bg-[#D4A65A]/20 border border-[#D4A65A]/30 text-white cursor-pointer"
                              title="Preview Full Email Content"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        <p className="text-[#EAE3D8] text-xs whitespace-pre-wrap leading-relaxed font-light">{c.content}</p>

                        {c.attachments && c.attachments.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#D4A65A]/10 flex flex-wrap gap-1">
                            {c.attachments.map((att: any, idx: number) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[8px] text-[#D4A65A] hover:text-white transition-colors"
                              >
                                <Paperclip className="h-2 w-2" />
                                <span className="max-w-[100px] truncate">{att.name}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex justify-between items-center text-[8px] text-[#CBBEAB] border-t border-[#D4A65A]/10 pt-2 font-mono">
                          <span>Template/Type: {c.templateName || 'Custom'}</span>
                          <span className={`${
                            (c.status?.toLowerCase() === 'delivered' || c.status?.toLowerCase() === 'sent') ? 'text-emerald-400' : c.status?.toLowerCase() === 'queued' ? 'text-amber-400' : 'text-rose-400'
                          } flex items-center gap-1`}>
                            <CheckCircle className="h-3 w-3" /> {c.status}
                          </span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 border border-dashed border-[#D4A65A]/20 rounded-2xl flex items-center justify-center text-[#CBBEAB] text-xs font-display">
                    No outbound logs registered.
                  </div>
                )}
              </motion.div>
            )}

            {/* 6. AI STUDIO */}
            {activeTab === 'ai' && (
              <motion.div initial="hidden" animate="show" variants={itemFade} className="space-y-6">
                {/* AI Interactive Panel */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-[#111111] border border-[#D4A65A]/20 relative overflow-hidden shadow-soft-luxe">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A65A]/5 rounded-full filter blur-xl" />
                  <AIOrb size="lg" showLabel />
                  
                  <div className="space-y-4 text-center md:text-left flex-grow relative z-10 font-display">
                    <h4 className="text-sm font-semibold text-[#E6C27A] tracking-wide flex items-center justify-center md:justify-start gap-2">
                      <Cpu className="h-4 w-4 text-[#D4A65A]" /> AI Design Director Desk
                    </h4>
                    <p className="text-xs text-[#CBBEAB] max-w-md leading-relaxed font-light font-sans">
                      Synthesize luxury summaries, conversion probabilities, material matrices, or compose custom follow-up scripts.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Button size="sm" variant="glass" onClick={() => handleTriggerAI('summarizer')} className="text-[9px] uppercase tracking-wider font-semibold border border-[#D4A65A]/20">
                        Summarize Lead
                      </Button>
                      <Button size="sm" variant="glass" onClick={() => handleTriggerAI('scoring')} className="text-[9px] uppercase tracking-wider font-semibold border border-[#D4A65A]/20">
                        Score Valuation
                      </Button>
                      <Button size="sm" variant="glass" onClick={() => handleTriggerAI('suggestions')} className="text-[9px] uppercase tracking-wider font-semibold border border-[#D4A65A]/20">
                        Design Materials
                      </Button>
                      <Button size="sm" variant="glass" onClick={() => handleTriggerAI('follow_up')} className="text-[9px] uppercase tracking-wider font-semibold border border-[#D4A65A]/20">
                        Follow-Up Script
                      </Button>
                    </div>
                  </div>
                </div>

                {/* AI Result Box */}
                <AnimatePresence mode="wait">
                  {(activeAiType || streamedText) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative p-6 rounded-3xl border border-[#D4A65A]/20 bg-[#111111] shadow-soft-luxe overflow-hidden text-left"
                    >
                      <div className="flex items-center justify-between border-b border-[#D4A65A]/10 pb-3 mb-4 font-display">
                        <span className="text-[9px] tracking-wider text-[#E6C27A] uppercase flex items-center gap-1.5 font-bold font-mono">
                          <Sparkles className="h-3.5 w-3.5 text-glow-gold animate-pulse" />
                          AI Design Director Findings ({activeAiType})
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D4A65A] animate-ping" />
                      </div>

                      {/* Streamed text */}
                      <div className="text-[#EAE3D8] text-xs font-sans whitespace-pre-wrap leading-relaxed font-light">
                        {streamedText || 'Retrieving styling matrices...'}
                      </div>

                      {/* Structural details */}
                      {activeAiOutput && activeAiType === 'scoring' && (
                        <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-xs font-display">
                          <div className="p-3 bg-[#171717] rounded-xl border border-[#D4A65A]/20">
                            <span className="text-[9px] text-[#CBBEAB] uppercase block font-mono">Value Tier</span>
                            <span className="text-xs font-bold text-white mt-1 block">
                              {activeAiOutput.scoreBreakdown.budgetRating}
                            </span>
                          </div>
                          <div className="p-3 bg-[#171717] rounded-xl border border-[#D4A65A]/20">
                            <span className="text-[9px] text-[#CBBEAB] uppercase block font-mono">Geo Sourcing</span>
                            <span className="text-xs font-bold text-white mt-1 block">
                              {activeAiOutput.scoreBreakdown.locationFeasibility}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>

      </div>

      {/* Email Preview Modal */}
      {selectedEmailForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard hoverEffect={false} className="w-full max-w-2xl p-6 relative border border-[#D4A65A]/35 glass-premium shadow-2xl">
            <button
              onClick={() => setSelectedEmailForPreview(null)}
              className="absolute top-4 right-4 text-[#CBBEAB] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-[#D4A65A]/25 pb-4 mb-4 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xxs tracking-widest text-[#8B7355] uppercase font-semibold font-sans">Email Dispatch Log</span>
                  <h2 className="text-xl font-serif text-[#D4A65A] mt-1">{selectedEmailForPreview.subject}</h2>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider ${
                  selectedEmailForPreview.status === 'delivered' || selectedEmailForPreview.status === 'sent'
                    ? 'bg-emerald-950/40 text-[#9BCF8A] border border-emerald-500/20'
                    : selectedEmailForPreview.status === 'queued'
                    ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
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

            <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-4 max-h-[40vh] overflow-y-auto text-xs text-[#EAE3D8] leading-relaxed whitespace-pre-wrap font-sans text-left">
              {selectedEmailForPreview.body}
            </div>

            {selectedEmailForPreview.errorMessage && (
              <div className="mt-4 p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-400 text-[10px] font-mono text-left">
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#D4A65A]/10 border border-white/5 hover:border-[#D4A65A]/35 text-[10px] text-[#EAE3D8] transition-all"
                    >
                      <Paperclip className="h-3 w-3 text-[#D4A65A]" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <ExternalLink className="h-2.5 w-2.5 text-[#CBBEAB]" />
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

export default ClientDetail;
