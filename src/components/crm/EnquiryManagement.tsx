import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Edit3, 
  Eye, 
  ChevronDown,
  Sparkles,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { Enquiry, LeadStatus, LeadPriority, ProjectType, PreferredStyle, LeadSource, UserProfile } from '../../types';
import { 
  useSimulatedPortalRole, 
  useGlobalTeamFilter 
} from '../../lib/assignments';
import { TeamSelector } from '../ui/TeamSelector';
import { ProfileCard } from '../ui/ProfileCard';

const JOURNEY_STAGES: { status: LeadStatus; label: string; desc: string }[] = [
  { status: 'New Lead', label: 'Lead Sourced', desc: 'Initial contact' },
  { status: 'Follow Up', label: 'Consultation', desc: 'Design style brief' },
  { status: 'Site Visit Scheduled', label: 'Site Visit', desc: 'Laser measurements' },
  { status: 'Quotation Sent', label: 'Concept Design', desc: 'Blueprint drafts' },
  { status: 'Negotiation', label: 'Proposal Desk', desc: 'Material quotation' },
  { status: 'Confirmed', label: 'Execution', desc: 'Contract confirmed' }
];

const PRIORITIES: LeadPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const PROJECT_TYPES: ProjectType[] = ['Home Interior', 'Office Interior', 'Commercial Interior'];
const STYLES: PreferredStyle[] = ['Modern', 'Luxury', 'Contemporary', 'Minimalist', 'Traditional'];

const priorityColors: Record<LeadPriority, string> = {
  Low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  High: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Urgent: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

export const EnquiryManagement: React.FC<{
  onSelectEnquiry: (id: string) => void;
  viewMode?: 'list' | 'kanban';
}> = ({ onSelectEnquiry, viewMode = 'list' }) => {
  const { 
    enquiries, 
    createEnquiry, 
    updateEnquiry, 
    deleteEnquiry,
    profiles
  } = useCRM();

  console.log("Profiles:", profiles);
  console.log("Enquiries:", enquiries);

  const { addToast } = useNotifications();

  // Search, Filter, and Sorting States
  const [search, setSearch] = useState('');
  const selectedJourneyStage = 'all';
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [sortBy] = useState<'date-desc' | 'budget-desc'>('date-desc');

  // Modals Control States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);

  const [portalRole] = useSimulatedPortalRole();
  const [globalFilter] = useGlobalTeamFilter();

  // Add Enquiry form state
  const [formData, setFormData] = useState({
    clientName: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    projectType: 'Home Interior' as ProjectType,
    location: '',
    budget: 150000,
    sqFtArea: 2500,
    preferredStyle: 'Luxury' as PreferredStyle,
    requirements: '',
    notes: '',
    leadSource: 'Website' as LeadSource,
    priority: 'Medium' as LeadPriority,
    status: 'New Lead' as LeadStatus,
    assignedStaffId: ''
  });

  // Set default assignedStaffId once profiles load
  useEffect(() => {
    if (profiles.length > 0 && !formData.assignedStaffId) {
      setFormData(prev => ({ ...prev, assignedStaffId: profiles[0].id }));
    }
  }, [profiles, formData.assignedStaffId]);

  // Filter & Sort logic (excluding Lost leads from active portfolio board)
  const filteredAndSortedEnquiries = useMemo(() => {
    let result = enquiries.filter((e: Enquiry) => {
      if (e.status === 'Lost') return false;
      
      const matchesSearch = 
        e.clientName.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        e.requirements.toLowerCase().includes(search.toLowerCase());
      
      const matchesStage = selectedJourneyStage === 'all' || e.status === selectedJourneyStage;
      const matchesType = filterType === 'all' || e.projectType === filterType;
      const matchesStyle = filterStyle === 'all' || e.preferredStyle === filterStyle;

      let matchesAssigned = true;
      if (portalRole !== 'Admin') {
        const staffProfile = profiles.find((p: UserProfile) => p.id === e.assignedStaffId);
        if (portalRole === 'Vendor Partner') {
          matchesAssigned = staffProfile?.role === 'Vendor Manager' || staffProfile?.role === 'Procurement Coordinator';
        } else {
          matchesAssigned = staffProfile?.role === portalRole;
        }
      } else if (globalFilter !== 'All') {
        matchesAssigned = e.assignedStaffId === globalFilter;
      }

      return matchesSearch && matchesStage && matchesType && matchesStyle && matchesAssigned;
    });

    result.sort((a: Enquiry, b: Enquiry) => {
      if (sortBy === 'budget-desc') return b.budget - a.budget;
      return b.createdAt.localeCompare(a.createdAt); // date-desc default
    });

    return result;
  }, [enquiries, search, selectedJourneyStage, filterType, filterStyle, sortBy, globalFilter, portalRole, profiles]);

  // Concept style mockup images mapping
  const conceptStyleImages: Record<PreferredStyle, string> = {
    Luxury: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&auto=format&fit=crop&q=80',
    Traditional: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&auto=format&fit=crop&q=80',
    Modern: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&auto=format&fit=crop&q=80',
    Minimalist: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
    Contemporary: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&auto=format&fit=crop&q=80'
  };

  // AI Recommendations mapping based on styles/budgets
  const getAIRecommendation = (style: PreferredStyle, _budget: number) => {
    if (style === 'Luxury') {
      return 'Lock in Carrara Calacatta Gold slab quarry allocations. Recommend bespoke satin brass trim hardware details.';
    }
    if (style === 'Minimalist') {
      return 'Lock in micro-cement finish for lounge floor plates. Recommend integrated shadow gap baseboards.';
    }
    if (style === 'Traditional') {
      return 'Propose walnut wall panels with gold classical moldings. Review handblown Murano chandelier catalog.';
    }
    if (style === 'Modern') {
      return 'Source floor-to-ceiling slimline slide profiles. Recommend aged oak kitchen veneer specimens.';
    }
    return 'Draft Belgian bouclé furniture packages. Recommend matte black hardware architectural contrast.';
  };

  // Add Form Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEnquiry(formData);
      setIsAddOpen(false);
      addToast('Client Registered', `${formData.clientName} portfolio created.`, 'success');
      setFormData({
        clientName: '',
        phoneNumber: '',
        email: '',
        companyName: '',
        projectType: 'Home Interior',
        location: '',
        budget: 150000,
        sqFtArea: 2500,
        preferredStyle: 'Luxury',
        requirements: '',
        notes: '',
        leadSource: 'Website',
        priority: 'Medium',
        status: 'New Lead',
        assignedStaffId: profiles[0]?.id || ''
      });
    } catch (err: any) {
      console.error('[EnquiryManagement] createEnquiry failed:', err);
      addToast('Registration error', err?.message || 'An unexpected error occurred.', 'error');
    }
  };

  const handleOpenEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnquiry) return;
    try {
      await updateEnquiry(editingEnquiry.id, editingEnquiry);
      setIsEditOpen(false);
      addToast('Lead details updated', `${editingEnquiry.clientName} record successfully modified.`, 'success');
    } catch (err) {
      addToast('Update failed', 'Please retry later.', 'error');
    }
  };

  const handlePromoteStatus = async (id: string, currentStatus: LeadStatus) => {
    const currentIdx = JOURNEY_STAGES.findIndex(s => s.status === currentStatus);
    if (currentIdx === -1 || currentIdx === JOURNEY_STAGES.length - 1) return;
    
    const nextStatus = JOURNEY_STAGES[currentIdx + 1].status;
    try {
      await updateEnquiry(id, { status: nextStatus });
      addToast('Journey Advanced', `Lead status promoted to ${nextStatus}`, 'success');
    } catch (err) {
      addToast('Promotion failed', 'Verify database connections.', 'error');
    }
  };

  const inputClass = "w-full bg-[#1C1C1E]/60 border border-[#D4A65A]/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A65A]/50 focus:ring-1 focus:ring-[#D4A65A]/30 transition-all";
  const selectClass = "w-full bg-[#1C1C1E]/60 border border-[#D4A65A]/20 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all cursor-pointer";
  const labelClass = "block text-[10px] tracking-widest text-[#D4A65A]/70 uppercase font-bold mb-1.5";

  return (
    <LayoutGroup>
      <div className="space-y-8 max-w-7xl mx-auto px-6 md:px-8 py-8 overflow-x-hidden">
        
        {/* Top Controls & Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-[#D4A65A]/15 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#D4A65A]/60 uppercase font-bold font-mono">Client Sourcing</span>
            <h1 className="text-4xl font-serif font-light text-white mt-1 tracking-wide">
              {viewMode === 'list' ? 'Client Enquiries Registry' : 'Visual Pipeline Journey'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#D4A65A]/50" />
              <input
                type="text"
                placeholder="Search clients..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-[#D4A65A]/20 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4A65A]/40 w-full sm:w-56 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-[#D4A65A]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A65A]/40 cursor-pointer transition-all"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all" className="bg-[#1C1C1E]">All Typologies</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t} className="bg-[#1C1C1E]">{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-[#D4A65A]/50 pointer-events-none" />
            </div>

            {/* Style Filter */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-[#D4A65A]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A65A]/40 cursor-pointer transition-all"
                value={filterStyle}
                onChange={e => setFilterStyle(e.target.value)}
              >
                <option value="all" className="bg-[#1C1C1E]">All Style Preferences</option>
                {STYLES.map(s => <option key={s} value={s} className="bg-[#1C1C1E]">{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-[#D4A65A]/50 pointer-events-none" />
            </div>

            {/* Add Button */}
            <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" /> Register Client
            </Button>
          </div>
        </div>

        {/* -------------------- VIEW MODE: LIST -------------------- */}
        {viewMode === 'list' && (
          <div className="glass-premium-gold rounded-3xl overflow-hidden border border-[#D4A65A]/15">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#D4A65A]/5 border-b border-[#D4A65A]/15 text-[#D4A65A]/60 font-mono text-[9px] uppercase tracking-widest">
                    <th className="py-4 px-6 font-bold">Client / Company</th>
                    <th className="py-4 px-4 font-bold">Typology & Style</th>
                    <th className="py-4 px-4 font-bold">Location</th>
                    <th className="py-4 px-4 font-bold">Budget & Area</th>
                    <th className="py-4 px-4 font-bold">Priority / Source</th>
                    <th className="py-4 px-4 font-bold">Assigned To</th>
                    <th className="py-4 px-4 font-bold">Journey Stage</th>
                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4A65A]/8">
                  {filteredAndSortedEnquiries.map((lead: Enquiry, i: number) => {
                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-[#D4A65A]/5 transition-colors text-white/70"
                      >
                        <td className="py-4 px-6">
                          <span 
                            onClick={() => onSelectEnquiry(lead.id)}
                            className="font-serif font-medium text-sm text-white block hover:text-[#D4A65A] cursor-pointer transition-colors"
                          >
                            {lead.clientName}
                          </span>
                          <span className="text-[9px] text-white/30 block font-mono mt-0.5">{lead.companyName || 'Private Account'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="block font-medium text-white">{lead.projectType}</span>
                          <span className="text-[9px] text-[#D4A65A]/60 block uppercase font-mono mt-0.5">{lead.preferredStyle}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#D4A65A]/60 flex-shrink-0" />
                            <span>{lead.location}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-[#D4A65A] font-semibold block">₹{lead.budget.toLocaleString()}</span>
                          <span className="text-[9px] text-white/30 block mt-0.5">{lead.sqFtArea} Sq Ft</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider block w-fit ${priorityColors[lead.priority]}`}>
                            {lead.priority}
                          </span>
                          <span className="text-[9px] text-white/30 block mt-1 font-light">Source: {lead.leadSource}</span>
                        </td>
                        <td className="py-4 px-4 font-display">
                          {(() => {
                            const staffProfile = profiles.find((p: UserProfile) => p.id === lead.assignedStaffId);
                            return staffProfile ? (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={staffProfile.profileImage || staffProfile.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60'} 
                                  alt={staffProfile.fullName} 
                                  className="h-6 w-6 rounded-full object-cover border border-[#D4A65A]/25" 
                                />
                                <div className="text-left leading-tight">
                                  <span className="font-semibold text-white text-xs block">{staffProfile.fullName}</span>
                                  <span className="text-[8px] text-[#D4A65A] block">{staffProfile.roleTitle || staffProfile.role} • {staffProfile.yearsExperience || 5}y Exp</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/30 italic text-[10px]">Unassigned</span>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-[#D4A65A]/10 border border-[#D4A65A]/25 text-[9px] font-bold text-[#D4A65A] uppercase tracking-wider">
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(lead)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                              title="Modify Details"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onSelectEnquiry(lead.id)}
                              className="p-1.5 rounded-lg hover:bg-[#D4A65A]/10 text-[#D4A65A]/60 hover:text-[#D4A65A] transition-colors cursor-pointer"
                              title="Inspect Deck"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredAndSortedEnquiries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-white/30">
                        No clients registered under selected parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- VIEW MODE: KANBAN -------------------- */}
        {viewMode === 'kanban' && (
          <div className="flex gap-5 overflow-x-auto pb-6 items-start min-h-[600px] -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,166,90,0.2) transparent' }}>
            {JOURNEY_STAGES.map(stage => {
              const stageLeads = filteredAndSortedEnquiries.filter((e: Enquiry) => e.status === stage.status);
              
              return (
                <div key={stage.status} className="w-[290px] flex-shrink-0 flex flex-col gap-3">
                  {/* Column Header */}
                  <div className="flex justify-between items-center glass-premium-gold px-4 py-3 rounded-2xl">
                    <div>
                      <span className="text-xs font-serif font-medium text-white block">{stage.label}</span>
                      <span className="text-[8px] text-[#D4A65A]/50 font-mono block uppercase tracking-wider mt-0.5">{stage.desc}</span>
                    </div>
                    <span className="h-6 w-6 rounded-full bg-[#D4A65A] text-black font-mono font-bold text-[10px] flex items-center justify-center">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards stack */}
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] pr-1">
                    <AnimatePresence mode="popLayout">
                      {stageLeads.map((lead: Enquiry) => {
                        const conceptImage = conceptStyleImages[lead.preferredStyle];
                        const aiRecommendation = getAIRecommendation(lead.preferredStyle, lead.budget);

                        return (
                          <motion.div
                            key={lead.id}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group relative rounded-2xl bg-[#1A1A1E] border border-[#D4A65A]/12 hover:border-[#D4A65A]/35 overflow-hidden transition-all duration-300 flex flex-col h-[275px] cursor-pointer"
                          >
                            <div className="h-20 w-full relative overflow-hidden">
                              <img src={conceptImage} alt={lead.clientName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 brightness-75" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1E] via-black/30 to-transparent" />
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[7.5px] font-semibold text-[#D4A65A] uppercase tracking-wider backdrop-blur-sm border border-[#D4A65A]/20">
                                {lead.projectType.split(' ')[0]}
                              </span>
                              <span className="absolute bottom-2 left-2.5 text-[11px] font-serif font-medium text-white">
                                {lead.clientName}
                              </span>
                            </div>

                            <div className="p-3.5 flex-grow flex flex-col justify-between">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] text-white/30 uppercase font-mono">{lead.companyName || 'Private Account'}</span>
                                  <span className="font-mono text-[#D4A65A] font-semibold text-xs">₹{(lead.budget / 1000).toFixed(0)}k</span>
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{lead.requirements}</p>
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t border-white/8 mt-2">
                                <div className="flex items-center gap-1.5 font-display text-[9px] text-white/60">
                                  {(() => {
                                    const staffProfile = profiles.find((p: UserProfile) => p.id === lead.assignedStaffId);
                                    return staffProfile ? (
                                      <>
                                        <img 
                                          src={staffProfile.profileImage || staffProfile.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60'} 
                                          alt={staffProfile.fullName} 
                                          className="h-5 w-5 rounded-full object-cover border border-[#D4A65A]/25" 
                                        />
                                        <span>Owner: {staffProfile.fullName}</span>
                                      </>
                                    ) : (
                                      <span className="italic text-white/30">Unassigned</span>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEdit(lead)}
                                    className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white cursor-pointer transition-colors"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  {stage.status !== 'Confirmed' && (
                                    <button
                                      onClick={() => handlePromoteStatus(lead.id, lead.status)}
                                      className="px-2 py-1 rounded bg-[#D4A65A]/15 hover:bg-[#D4A65A]/25 text-[#D4A65A] text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer transition-colors"
                                      title="Advance Pipeline"
                                    >
                                      Advance <ArrowRight className="h-2.5 w-2.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onSelectEnquiry(lead.id)}
                                    className="p-1 rounded hover:bg-[#D4A65A]/10 text-[#D4A65A]/60 hover:text-[#D4A65A] cursor-pointer transition-colors"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Hover AI Overlay */}
                            <div className="absolute inset-0 bg-[#0D0D0F]/95 p-4 border border-[#D4A65A]/20 transform translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 flex flex-col justify-between z-10 backdrop-blur-sm">
                              <div className="space-y-2">
                                <span className="text-[8px] tracking-wider text-[#D4A65A] uppercase flex items-center gap-1 font-bold font-mono">
                                  <Sparkles className="h-3 w-3 animate-pulse" /> AI recommendation
                                </span>
                                <p className="text-[10px] text-white/60 leading-normal font-light">
                                  {aiRecommendation}
                                </p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                <span className="text-[8px] text-white/30 font-mono">Style: {lead.preferredStyle}</span>
                                <button 
                                  onClick={() => onSelectEnquiry(lead.id)}
                                  className="text-[9px] text-[#D4A65A] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  Details <Eye className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {stageLeads.length === 0 && (
                      <div className="py-8 text-center text-white/20 text-xs italic border-2 border-dashed border-[#D4A65A]/10 rounded-2xl">
                        Empty column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL 1: ADD */}
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Luxury Project Enquiry" size="lg">
          <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Client Name *</label>
                <input required type="text" className={inputClass} value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Company (Optional)</label>
                <input type="text" className={inputClass} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone *</label>
                <input required type="text" className={inputClass} value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input required type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Typology</label>
                <select className={selectClass} value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value as ProjectType })}>
                  {PROJECT_TYPES.map(t => <option key={t} value={t} className="bg-[#1C1C1E]">{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Preferred Style</label>
                <select className={selectClass} value={formData.preferredStyle} onChange={e => setFormData({ ...formData, preferredStyle: e.target.value as PreferredStyle })}>
                  {STYLES.map(s => <option key={s} value={s} className="bg-[#1C1C1E]">{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select className={selectClass} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as LeadPriority })}>
                  {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#1C1C1E]">{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Location *</label>
                <input required type="text" className={inputClass} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Budget (₹)</label>
                <input type="number" className={inputClass} value={formData.budget} onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Area (Sq Ft)</label>
                <input type="number" className={inputClass} value={formData.sqFtArea} onChange={e => setFormData({ ...formData, sqFtArea: Number(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-3">
              <label className={labelClass}>Assigned Team Member *</label>
              <TeamSelector
                profiles={profiles}
                selectedId={formData.assignedStaffId}
                onChange={id => setFormData({ ...formData, assignedStaffId: id })}
                placeholder="Choose team member to assign..."
              />
              {formData.assignedStaffId && (
                <div className="mt-3">
                  <span className="text-[9px] text-[#8B7355] uppercase font-mono tracking-wider font-semibold block mb-1">Assignee Profile Preview</span>
                  <ProfileCard profile={profiles.find((p: UserProfile) => p.id === formData.assignedStaffId)} />
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Directives & Notes</label>
              <textarea rows={3} placeholder="Details of client requirements, marble selections, layout ideas..." className={inputClass + ' resize-none'} value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>Discard</Button>
              <Button variant="gold" type="submit">Establish Lead</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: EDIT */}
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Lead Parameters" size="lg">
          {editingEnquiry && (
            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Client Name *</label>
                  <input required type="text" className={inputClass} value={editingEnquiry.clientName} onChange={e => setEditingEnquiry({ ...editingEnquiry, clientName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Company</label>
                  <input type="text" className={inputClass} value={editingEnquiry.companyName || ''} onChange={e => setEditingEnquiry({ ...editingEnquiry, companyName: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input required type="text" className={inputClass} value={editingEnquiry.phoneNumber} onChange={e => setEditingEnquiry({ ...editingEnquiry, phoneNumber: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input required type="email" className={inputClass} value={editingEnquiry.email} onChange={e => setEditingEnquiry({ ...editingEnquiry, email: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Typology</label>
                  <select className={selectClass} value={editingEnquiry.projectType} onChange={e => setEditingEnquiry({ ...editingEnquiry, projectType: e.target.value as ProjectType })}>
                    {PROJECT_TYPES.map(t => <option key={t} value={t} className="bg-[#1C1C1E]">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Style Preference</label>
                  <select className={selectClass} value={editingEnquiry.preferredStyle} onChange={e => setEditingEnquiry({ ...editingEnquiry, preferredStyle: e.target.value as PreferredStyle })}>
                    {STYLES.map(s => <option key={s} value={s} className="bg-[#1C1C1E]">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select className={selectClass} value={editingEnquiry.priority} onChange={e => setEditingEnquiry({ ...editingEnquiry, priority: e.target.value as LeadPriority })}>
                    {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#1C1C1E]">{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Location *</label>
                  <input required type="text" className={inputClass} value={editingEnquiry.location} onChange={e => setEditingEnquiry({ ...editingEnquiry, location: e.target.value })} />
                </div>
                <div>
                   <label className={labelClass}>Budget (₹)</label>
                  <input type="number" className={inputClass} value={editingEnquiry.budget} onChange={e => setEditingEnquiry({ ...editingEnquiry, budget: Number(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass}>Area (Sq Ft)</label>
                  <input type="number" className={inputClass} value={editingEnquiry.sqFtArea} onChange={e => setEditingEnquiry({ ...editingEnquiry, sqFtArea: Number(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-3">
                <label className={labelClass}>Assigned Team Member *</label>
                <TeamSelector
                  profiles={profiles}
                  selectedId={editingEnquiry.assignedStaffId || ''}
                  onChange={id => setEditingEnquiry({ ...editingEnquiry, assignedStaffId: id })}
                  placeholder="Choose team member to assign..."
                />
                {editingEnquiry.assignedStaffId && (
                  <div className="mt-3">
                    <span className="text-[9px] text-[#8B7355] uppercase font-mono tracking-wider font-semibold block mb-1">Assignee Profile Preview</span>
                    <ProfileCard profile={profiles.find((p: UserProfile) => p.id === editingEnquiry.assignedStaffId)} />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Directives & Notes</label>
                <textarea rows={3} className={inputClass + ' resize-none'} value={editingEnquiry.requirements} onChange={e => setEditingEnquiry({ ...editingEnquiry, requirements: e.target.value })} />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button 
                  type="button" 
                  variant="danger" 
                  onClick={async () => {
                    if (window.confirm(`Delete client record ${editingEnquiry.clientName}?`)) {
                      await deleteEnquiry(editingEnquiry.id);
                      setIsEditOpen(false);
                      addToast('Lead Removed', 'Deleted lead profile successfully.', 'success');
                    }
                  }}
                >
                  Purge Client
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button variant="gold" type="submit">Modify Record</Button>
                </div>
              </div>
            </form>
          )}
        </Modal>

      </div>
    </LayoutGroup>
  );
};

export default EnquiryManagement;
