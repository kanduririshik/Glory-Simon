import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Clock, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  IndianRupee,
  UserCheck,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useAI } from '../context/AIContext';
import { GlassCard } from '../components/ui/Card';
import { 
  useSimulatedPortalRole,
  useGlobalTeamFilter
} from '../lib/assignments';
import { Button } from '../components/ui/Button';
import { AIOrb } from '../components/ui/AIOrb';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const DashboardPage: React.FC<{ 
  onNavigate: (tab: string) => void;
  onSelectEnquiry: (id: string) => void;
}> = ({ onNavigate, onSelectEnquiry }) => {
  const { enquiries, siteVisits, quotations, profiles, emailLogs } = useCRM();
  const { orbState, setOrbState } = useAI();

  const [portalRole] = useSimulatedPortalRole();
  const [globalFilter] = useGlobalTeamFilter();

  // Debugging console logs
  console.log("Profiles:", profiles);
  console.log("Enquiries:", enquiries);
  console.log("Site Visits:", siteVisits);
  console.log("Quotations:", quotations);

  // Filter enquiries based on simulated role and global filter
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
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

  // Filter site visits based on simulated role and global filter
  const filteredVisits = useMemo(() => {
    return siteVisits.filter(v => {
      let matchesAssigned = true;
      if (portalRole !== 'Admin') {
        const engineerProfile = profiles.find(p => p.id === v.engineerId);
        const linkedEnquiry = enquiries.find(e => e.id === v.enquiryId);
        const enquiryStaff = profiles.find(p => p.id === linkedEnquiry?.assignedStaffId);
        
        if (portalRole === 'Vendor Partner') {
          matchesAssigned = engineerProfile?.role === 'Vendor Manager' || enquiryStaff?.role === 'Vendor Manager';
        } else {
          matchesAssigned = engineerProfile?.role === portalRole || enquiryStaff?.role === portalRole;
        }
      } else if (globalFilter !== 'All') {
        const linkedEnquiry = enquiries.find(e => e.id === v.enquiryId);
        matchesAssigned = v.engineerId === globalFilter || linkedEnquiry?.assignedStaffId === globalFilter;
      }
      return matchesAssigned;
    });
  }, [siteVisits, globalFilter, portalRole, enquiries, profiles]);

  // Sourcing metrics calculations
  const totalLeads = enquiries.length;
  const confirmedProjectsCount = enquiries.filter(e => ['Confirmed', 'Project Confirmed', 'Won', 'Active Project', 'In Progress'].includes(e.status)).length;
  const activeQuotesCount = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const scheduledVisitsCount = siteVisits.filter(v => v.status === 'Scheduled').length;

  const activeStaffCount = useMemo(() => {
    return profiles.filter(p => enquiries.some(e => e.assignedStaffId === p.id && e.status !== 'Lost')).length;
  }, [profiles, enquiries]);
  
  const teamUtilization = profiles.length > 0 ? Math.round((activeStaffCount / profiles.length) * 100) : 0;

  const revenuePipelineSum = useMemo(() => {
    return enquiries.filter(e => e.status !== 'Lost').reduce((sum, e) => sum + (e.budget || 0), 0);
  }, [enquiries]);

  const dynamicConfirmedValue = useMemo(() => {
    return enquiries.filter(e => e.status === 'Confirmed').reduce((sum, e) => sum + (e.budget || 0), 0);
  }, [enquiries]);

  // Email Sourcing Analytics Metrics
  const emailsSentToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return emailLogs.filter(log => {
      const logDateStr = new Date(log.sentAt || log.createdAt).toISOString().split('T')[0];
      return logDateStr === todayStr && (log.status === 'sent' || log.status === 'delivered');
    }).length;
  }, [emailLogs]);

  const quotationsSentCount = useMemo(() => {
    return emailLogs.filter(log => log.emailType.toLowerCase().includes('quote') && (log.status === 'sent' || log.status === 'delivered')).length;
  }, [emailLogs]);

  const invoicesSentCount = useMemo(() => {
    return emailLogs.filter(log => log.emailType.toLowerCase().includes('invoice') && (log.status === 'sent' || log.status === 'delivered')).length;
  }, [emailLogs]);

  const failedDeliveriesCount = useMemo(() => {
    return emailLogs.filter(log => log.status === 'failed').length;
  }, [emailLogs]);

  const openCommunicationsCount = useMemo(() => {
    const uniqueClients = new Set(emailLogs.map(log => log.enquiryId).filter(Boolean));
    return uniqueClients.size;
  }, [emailLogs]);

  // Team Sourcing ownership analytics using live profiles
  const teamAnalytics = useMemo(() => {
    return profiles.map(member => {
      const leads = enquiries.filter(e => e.assignedStaffId === member.id);
      const projects = enquiries.filter(e => ['Confirmed', 'Project Confirmed', 'Won', 'Active Project', 'In Progress'].includes(e.status) && e.assignedStaffId === member.id);
      const visits = siteVisits.filter(v => v.engineerId === member.id);
      const quotes = quotations.filter(q => q.consultantId === member.id);
      const quoteVal = quotes.reduce((sum, q) => sum + q.amount, 0);
      
      return {
        id: member.id,
        name: member.fullName,
        avatar: member.profileImage || member.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60',
        role: member.roleTitle || member.role,
        leadsCount: leads.length,
        projectsCount: projects.length,
        visitsCount: visits.length,
        quotesCount: quotes.length,
        quotesValue: quoteVal
      };
    });
  }, [profiles, enquiries, siteVisits, quotations]);

  // Recent Sourcing assignments mapped to live profiles
  const recentAssignmentsList = useMemo(() => {
    const list: { title: string; target: string; member: string; type: string }[] = [];
    
    enquiries.slice(0, 3).forEach(e => {
      const staffProfile = profiles.find(p => p.id === e.assignedStaffId);
      list.push({
        title: `${e.clientName}`,
        target: e.projectType,
        member: staffProfile ? staffProfile.fullName : 'Unassigned',
        type: 'Lead'
      });
    });

    siteVisits.slice(0, 3).forEach(v => {
      const e = enquiries.find(item => item.id === v.enquiryId);
      const staffProfile = profiles.find(p => p.id === v.engineerId);
      list.push({
        title: `Site: ${e?.clientName || 'Private'}`,
        target: new Date(v.scheduledAt).toLocaleDateString(),
        member: staffProfile ? staffProfile.fullName : 'Unassigned',
        type: 'Visit'
      });
    });

    quotations.slice(0, 3).forEach(q => {
      const e = enquiries.find(item => item.id === q.enquiryId);
      const staffProfile = profiles.find(p => p.id === q.consultantId);
      list.push({
        title: `Quote: ${e?.clientName || 'Private'}`,
        target: q.quotationNumber,
        member: staffProfile ? staffProfile.fullName : 'Unassigned',
        type: 'Quote'
      });
    });
    
    return list.slice(0, 4);
  }, [enquiries, siteVisits, quotations, profiles]);

  // AI Summary Stream Simulation
  const [aiText, setAiText] = useState('');
  const [showRecs, setShowRecs] = useState(false);
  const [selectedRecIndex, setSelectedRecIndex] = useState(0);

  const rawSummary = `Welcome back to your Digital Headquarters, Glory. Here is your AI Design Director briefing:
• ${enquiries.length} Active luxury accounts registered in the sourcing pipeline.
• ${siteVisits.filter(v => v.status === 'Scheduled').length} Physical site inspections scheduled for structural modeling.
• ${quotations.filter(q => q.status === 'Sent').length} Golden material proposals awaiting client signature.
• Nero Marquina and Calacatta Gold supply chain locks verified.`;

  useEffect(() => {
    let currentText = '';
    let index = 0;
    const words = rawSummary.split(' ');
    setOrbState('streaming');

    const interval = setInterval(() => {
      if (index < words.length) {
        currentText += words[index] + ' ';
        setAiText(currentText);
        index++;
      } else {
        clearInterval(interval);
        setOrbState('idle');
        setShowRecs(true);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [enquiries.length, siteVisits, quotations]);

  // Featured Project of the Month
  const featuredProject = {
    title: 'The Calacatta Penthouse',
    client: 'Alistair Sterling',
    location: 'Penthouse Suite, Manhattan',
    budget: 450000,
    area: 5200,
    style: 'Luxury',
    description: 'A masterpiece of contemporary luxury featuring custom vein-matched Calacatta Gold marble slabs imported from Carrara, Italy, brushed brass trim accents, and floor-to-ceiling panoramic glass panels.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80'
  };

  // Sourcing Activity Feed
  const activityList = useMemo(() => {
    const list = [
      { id: 'act1', type: 'status', user: 'Glory Simon', detail: 'Promoted Alistair Sterling to Negotiation', time: '10m ago' },
      { id: 'act2', type: 'visit', user: 'David Ross', detail: 'Completed site measurements for Julian Thorne', time: '1h ago' },
      { id: 'act3', type: 'quote', user: 'Sarah Jenkins', detail: 'Sent QT-2026-001 proposal to Thorne Legal Group', time: '3h ago' },
      { id: 'act4', type: 'comms', user: 'Elena Rostova', detail: 'Logged WhatsApp message to Sophia Patel', time: 'Yesterday' }
    ];
    return list;
  }, []);

  // AI recommendations
  const aiRecommendations = [
    {
      title: 'The Calacatta Penthouse',
      client: 'Alistair Sterling',
      action: 'Lock in 420m² of custom vein-matched Calacatta Gold slabs from Carrara.',
      influence: 'Saves 12% logistics overhead and secures project margins.',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&auto=format&fit=crop&q=80',
      id: 'e1'
    },
    {
      title: 'Versailles Classical Estate',
      client: 'Victoria Montgomery',
      action: 'Assign Sarah Jenkins for site visit and classical moldings CAD blueprint approval.',
      influence: 'Slashes architectural layout validation phase by 5 days.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80',
      id: 'e2'
    },
    {
      title: 'The Financial Center Loft',
      client: 'Julian Thorne',
      action: 'Verify acoustic walnut wood cladding partition quotes and sound dampening test.',
      influence: 'Maintains 94% client confidence score in layout phase.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop&q=80',
      id: 'e3'
    }
  ];

  // Revenue Pipeline data
  const revenueChartData = useMemo(() => {
    return [
      { month: 'Jan', pipeline: 350000, confirmed: 120000 },
      { month: 'Feb', pipeline: 580000, confirmed: 220000 },
      { month: 'Mar', pipeline: 750000, confirmed: 380000 },
      { month: 'Apr', pipeline: 900000, confirmed: 500000 },
      { month: 'May', pipeline: 1250000, confirmed: 820000 },
      { month: 'Jun', pipeline: revenuePipelineSum || 1350000, confirmed: dynamicConfirmedValue || 820000 }
    ];
  }, [revenuePipelineSum, dynamicConfirmedValue]);

  const projectTypeData = useMemo(() => {
    return [
      { name: 'Luxury Villas', value: filteredEnquiries.filter(e => e.projectType === 'Home Interior').length || 4, color: '#D4A65A' },
      { name: 'Ateliers & Offices', value: filteredEnquiries.filter(e => e.projectType === 'Office Interior').length || 2, color: '#8B7355' },
      { name: 'Hospitality & Commercial', value: filteredEnquiries.filter(e => e.projectType === 'Commercial Interior').length || 1, color: '#C76B4F' }
    ];
  }, [filteredEnquiries]);

  // Upcoming Site Visits
  const upcomingVisits = useMemo(() => {
    return filteredVisits
      .filter(v => v.status === 'Scheduled')
      .slice(0, 3)
      .map(v => {
        const enquiry = filteredEnquiries.find(e => e.id === v.enquiryId);
        return {
          id: v.id,
          clientName: enquiry?.clientName || 'Private Client',
          location: enquiry?.location || 'Unknown location',
          date: new Date(v.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          notes: v.notes || 'Structural site inspection and layout briefing.'
        };
      });
  }, [filteredVisits, filteredEnquiries]);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemFade = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 180, damping: 22 } }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-16 pb-20 bg-[#0A0A0A]"
    >
      {/* 1. Cinematic Luxury Hero Section */}
      <motion.div 
        variants={itemFade}
        className="relative h-[65vh] w-full flex items-center justify-center overflow-hidden border-b border-[#D4A65A]/15 bg-[#050505]"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=90" 
            alt="Luxury Villa Interior" 
            className="w-full h-full object-cover brightness-40 filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#0A0A0A]/40 to-[#0A0A0A]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-radial from-[#D4A65A]/5 to-transparent pointer-events-none filter blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-6">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xxs tracking-[0.5em] text-[#E6C27A] uppercase font-bold block font-display"
          >
            Glory Simon Interiors
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-4xl md:text-6xl font-serif font-medium text-white tracking-tight leading-tight block text-center"
          >
            Designing Extraordinary <br />
            <span className="italic font-light text-[#E6C27A]">Living Spaces</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="text-xs md:text-sm text-[#A9A9A9] max-w-xl mx-auto font-light tracking-wide leading-relaxed block text-center"
          >
            Welcome to the digital command center of Glory Simon Interiors. Elevate your spatial concepts and pipeline metrics through integrated design coordination.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="pt-2 flex justify-center gap-4"
          >
            <Button 
              variant="gold" 
              onClick={() => onNavigate('crm')}
              className="px-6 py-2.5 rounded-full text-xxs font-bold tracking-widest uppercase hover:scale-105"
            >
              Client Enquiries
            </Button>
            <Button 
              variant="glass" 
              onClick={() => onNavigate('studio')}
              className="px-6 py-2.5 rounded-full text-xxs font-bold tracking-widest uppercase"
            >
              Design Studio
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-16">
        
        {/* 2. Executive KPI Header Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Leads', val: totalLeads, icon: <UserCheck className="h-4 w-4 text-[#D4A65A]" />, trend: 'Total in registry' },
            { label: 'Confirmed Projects', val: confirmedProjectsCount, icon: <TrendingUp className="h-4 w-4 text-[#5D8A72]" />, trend: 'Active portfolio' },
            { label: 'Active Quotations', val: activeQuotesCount, icon: <IndianRupee className="h-4 w-4 text-[#E6C27A]" />, trend: 'Drafts & sent' },
            { label: 'Site Visits', val: scheduledVisitsCount, icon: <Calendar className="h-4 w-4 text-[#C76B4F]" />, trend: 'Inspections scheduled' },
            { label: 'Team Utilization', val: `${teamUtilization}%`, icon: <UserCheck className="h-4 w-4 text-sky-400" />, trend: 'Allocated members' },
            { label: 'Revenue Pipeline', val: `₹${(revenuePipelineSum / 1000).toFixed(0)}K`, icon: <IndianRupee className="h-4 w-4 text-emerald-400" />, trend: 'Total active budget' }
          ].map((kpi, idx) => (
            <motion.div key={idx} variants={itemFade} className="col-span-1">
              <GlassCard hoverEffect={true} className="p-4 border-[#D4A65A]/10 bg-[#141414]/40 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#A9A9A9] leading-tight">{kpi.label}</span>
                  <div className="p-1.5 rounded-lg bg-[#D4A65A]/5 border border-[#D4A65A]/10 flex-shrink-0">{kpi.icon}</div>
                </div>
                <div className="mt-2 text-left">
                  <h3 className="text-xl font-serif font-bold text-white tracking-wide">{kpi.val}</h3>
                  <span className="text-[8px] text-[#A9A9A9]/60 font-mono block mt-0.5">{kpi.trend}</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Email Dispatch & Delivery Bento */}
        <motion.div variants={itemFade} className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#D4A65A]/10 pb-2.5 text-left">
            <div>
              <h3 className="text-xs font-semibold text-[#E6C27A] font-display uppercase tracking-widest">
                Gmail Dispatch Analytics
              </h3>
              <p className="text-[10px] text-[#A9A9A9] mt-0.5 font-light">Automated proposal metrics and delivery feedback loop.</p>
            </div>
            <button 
              onClick={() => onNavigate('communication')}
              className="px-3 py-1 rounded bg-[#D4A65A]/10 hover:bg-[#D4A65A]/25 border border-[#D4A65A]/30 text-white font-mono text-[9px] uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              Correspondence Room
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { label: 'Emails Sent Today', val: emailsSentToday, color: '#D4A65A', status: 'live delivery feed' },
              { label: 'Quotations Emailed', val: quotationsSentCount, color: '#E6C27A', status: 'formal proposals' },
              { label: 'Invoices Emailed', val: invoicesSentCount, color: '#9BCF8A', status: 'retainer dispatches' },
              { label: 'Failed Deliveries', val: failedDeliveriesCount, color: failedDeliveriesCount > 0 ? '#C76B4F' : '#A9A9A9', status: failedDeliveriesCount > 0 ? 'needs attention' : 'clean ledger' },
              { label: 'Open Sourcing Threads', val: openCommunicationsCount, color: '#8B7355', status: 'active client accounts' }
            ].map((metric, idx) => (
              <GlassCard key={idx} hoverEffect={true} className="p-4 border-white/5 hover:border-[#D4A65A]/35 bg-[#141414]/30 flex flex-col justify-between h-28 text-left transition-all duration-300">
                <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#CBBEAB] leading-tight block">{metric.label}</span>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <h3 className="text-2xl font-serif font-bold text-white tracking-wide" style={{ color: metric.val > 0 && metric.label.includes('Failed') ? '#C76B4F' : undefined }}>{metric.val}</h3>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: metric.color }} />
                </div>
                <span className="text-[8px] text-[#A9A9A9]/50 font-mono block mt-1.5 uppercase tracking-wider">{metric.status}</span>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* 3. Luxury Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* AI Design Director (Large Tile - span 8 cols) */}
          <motion.div variants={itemFade} className="lg:col-span-8">
            <GlassCard variant="gold" hoverEffect={false} className="p-8 h-full flex flex-col justify-between relative overflow-hidden min-h-[300px]">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#D4A65A]/5 rounded-full filter blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start z-10">
                <div className="space-y-1">
                  <span className="text-[9px] tracking-widest text-[#E6C27A] uppercase flex items-center gap-1.5 font-bold font-mono">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#D4A65A]" />
                    AI Design Director Briefing
                  </span>
                  <h3 className="text-2xl font-serif text-white font-medium mt-1">Real-time Sourcing Intelligence</h3>
                </div>
                <div className="cursor-pointer" onClick={() => setOrbState(orbState === 'idle' ? 'thinking' : 'idle')}>
                  <AIOrb size="md" />
                </div>
              </div>

              <div className="my-6 z-10 text-left">
                <p className="text-sm leading-relaxed font-light text-[#F5F1EA]/90 font-display whitespace-pre-line border-l border-[#D4A65A]/20 pl-4">
                  {aiText}
                  {orbState === 'streaming' && <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#D4A65A] animate-pulse" />}
                </p>
              </div>

              <div className="border-t border-[#D4A65A]/10 pt-4 z-10 flex justify-between items-center text-[10px]">
                <span className="text-[#A9A9A9] font-mono uppercase tracking-wider">STATUS: ACTIVE PIPELINE</span>
                <button 
                  onClick={() => onNavigate('ai-director')}
                  className="text-[#D4A65A] hover:text-[#E6C27A] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Open AI Director Console <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* AI Next Actions Suggestions (Span 4 cols) */}
          <motion.div variants={itemFade} className="lg:col-span-4">
            <GlassCard className="p-8 h-full bg-[#141414]/50 border-[#D4A65A]/15 shadow-soft-luxe flex flex-col justify-between min-h-[300px] text-left">
              <div>
                <h4 className="text-[10px] font-semibold text-[#A9A9A9] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">
                  AI Recommended Steps
                </h4>
                <AnimatePresence mode="wait">
                  {showRecs && (
                    <motion.div
                      key={selectedRecIndex}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="space-y-4 mt-6"
                    >
                      <span className="text-[10px] font-mono text-[#D4A65A] font-bold block uppercase tracking-wider">
                        Client Focus: {aiRecommendations[selectedRecIndex].client}
                      </span>
                      <p className="text-sm text-white font-serif font-medium leading-snug">
                        {aiRecommendations[selectedRecIndex].action}
                      </p>
                      <p className="text-[11px] text-[#A9A9A9] font-light italic">
                        Influence: {aiRecommendations[selectedRecIndex].influence}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#D4A65A]/10">
                <div className="flex gap-1.5">
                  {aiRecommendations.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedRecIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        selectedRecIndex === idx ? 'w-5 bg-[#D4A65A]' : 'w-1.5 bg-[#141414] border border-[#D4A65A]/25'
                      }`}
                    />
                  ))}
                </div>
                <button 
                  onClick={() => {
                    const rec = aiRecommendations[selectedRecIndex];
                    onSelectEnquiry(rec.id);
                    onNavigate('detail');
                  }}
                  className="text-xs text-[#D4A65A] hover:text-[#E6C27A] font-bold cursor-pointer transition-colors"
                >
                  Inspect Lead
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Featured Showcase Area (Large Tile - span 8 cols) */}
          <motion.div variants={itemFade} className="lg:col-span-8">
            <GlassCard className="p-0 overflow-hidden bg-[#141414]/30 border-[#D4A65A]/15 shadow-soft-luxe h-full flex flex-col justify-between">
              <div className="h-72 w-full relative overflow-hidden group">
                <img 
                  src={featuredProject.image} 
                  alt={featuredProject.title} 
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[4s] ease-out brightness-[55%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                <div className="absolute top-6 left-6">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#0A0A0A]/70 backdrop-blur-md border border-[#D4A65A]/25 text-[8px] font-semibold text-[#E6C27A] uppercase tracking-wider font-display shadow-lg">
                    Featured Project Showcase
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <span className="text-[9px] text-[#D4A65A] font-mono tracking-widest uppercase block">Contemporary Masterwork</span>
                  <h3 className="text-3xl font-serif text-white block mt-1 leading-tight">{featuredProject.title}</h3>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-xs text-[#A9A9A9] font-light leading-relaxed text-left">
                  {featuredProject.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-[#D4A65A]/10 pt-6 text-left font-display">
                  <div>
                    <span className="text-[8px] text-[#A9A9A9] block uppercase font-mono tracking-widest">Client Account</span>
                    <span className="text-xs font-semibold text-white mt-1.5 block">{featuredProject.client}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#A9A9A9] block uppercase font-mono tracking-widest">Sourcing Budget</span>
                    <span className="text-xs font-semibold text-[#D4A65A] mt-1.5 block font-mono font-medium">₹{(featuredProject.budget / 1000).toFixed(0)}k</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#A9A9A9] block uppercase font-mono tracking-widest">Gross Floor Area</span>
                    <span className="text-xs font-semibold text-white mt-1.5 block">{featuredProject.area} Sq Ft</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Upcoming visits Sourcing Timeline (Span 4 cols) */}
          <motion.div variants={itemFade} className="lg:col-span-4">
            <GlassCard className="p-8 bg-[#141414]/50 border-[#D4A65A]/15 shadow-soft-luxe h-full flex flex-col justify-between min-h-[300px]">
              <div>
                <h4 className="text-[10px] font-semibold text-[#A9A9A9] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#D4A65A]" /> Sourcing Site Inspections
                </h4>
                <div className="space-y-6 mt-6">
                  {upcomingVisits.map(visit => (
                    <div key={visit.id} className="flex gap-4 items-start relative text-left group">
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <div className="h-2 w-2 rounded-full bg-[#D4A65A] shadow-[0_0_8px_rgba(212,166,90,0.8)] group-hover:scale-110 transition-transform" />
                        <div className="w-[1px] h-12 bg-[#D4A65A]/15 mt-1" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8.5px] text-[#C76B4F] font-mono block font-semibold">{visit.date}</span>
                        <span className="text-xs font-semibold text-white block group-hover:text-[#D4A65A] transition-colors">{visit.clientName}</span>
                        <p className="text-[10px] text-[#A9A9A9] font-light leading-relaxed line-clamp-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#A9A9A9]/60" /> {visit.location}
                        </p>
                      </div>
                    </div>
                  ))}
                  {upcomingVisits.length === 0 && (
                    <div className="text-center py-12 text-[#A9A9A9]/60 text-xs italic">
                      No inspections scheduled.
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => onNavigate('scheduler')} 
                className="w-full text-center text-[9px] text-[#D4A65A] hover:text-[#E6C27A] font-bold mt-4 block uppercase tracking-widest transition-colors cursor-pointer"
              >
                Inspect Schedule Console
              </button>
            </GlassCard>
          </motion.div>

          {/* Revenue chart (Span 8 cols) */}
          <motion.div variants={itemFade} className="lg:col-span-8">
            <GlassCard className="p-8 bg-[#141414]/30 border-[#D4A65A]/15 shadow-soft-luxe h-full">
              <div className="flex items-center justify-between mb-6 border-b border-[#D4A65A]/10 pb-4">
                <div className="text-left">
                  <h3 className="text-xs font-semibold text-[#E6C27A] font-display uppercase tracking-wider">Revenue Pipeline</h3>
                  <p className="text-[10px] text-[#A9A9A9] mt-0.5">Budget progression vs. actual closed client retentions.</p>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-mono uppercase font-semibold">
                  <span className="flex items-center gap-1.5 text-[#D4A65A]"><span className="h-2 w-2 rounded-full bg-[#D4A65A]" /> Pipeline</span>
                  <span className="flex items-center gap-1.5 text-[#C76B4F]"><span className="h-2 w-2 rounded-full bg-[#C76B4F]" /> Confirmed</span>
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="luxeGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A65A" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#D4A65A" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="luxeTerracotta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C76B4F" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#C76B4F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#A9A9A9" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A9A9A9" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(212,166,90,0.25)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      labelStyle={{ color: '#E6C27A', fontSize: 10, fontFamily: 'monospace' }}
                      itemStyle={{ color: '#fff', fontSize: 11 }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, '']}
                    />
                    <Area type="monotone" dataKey="pipeline" stroke="#D4A65A" strokeWidth={1.5} fillOpacity={1} fill="url(#luxeGold)" />
                    <Area type="monotone" dataKey="confirmed" stroke="#C76B4F" strokeWidth={1.5} fillOpacity={1} fill="url(#luxeTerracotta)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Allocation by Typology Pie & Sourcing Feed (Span 4 cols) */}
          <motion.div variants={itemFade} className="lg:col-span-4 flex flex-col gap-8">
            <GlassCard className="p-8 bg-[#141414]/50 border-[#D4A65A]/15 shadow-soft-luxe h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#E6C27A] font-display uppercase tracking-wider border-b border-[#D4A65A]/10 pb-3">Accounts by Typology</h3>
                
                <div className="h-44 flex items-center justify-center relative mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={68}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {projectTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(212,166,90,0.25)', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-serif font-bold text-white">{filteredEnquiries.length}</span>
                    <span className="text-[7.5px] tracking-widest uppercase text-[#A9A9A9] font-bold font-mono">Accounts</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-4 font-display">
                {projectTypeData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xxs border-b border-[#D4A65A]/5 pb-1.5 uppercase tracking-wider">
                    <span className="flex items-center gap-2 text-[#A9A9A9]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

        </div>

        {/* 4. Glory Simon Team Sourcing & Analytics */}
        <motion.div variants={itemFade} className="space-y-6">
          <div className="flex justify-between items-center border-b border-[#D4A65A]/10 pb-3 text-left">
            <div>
              <h3 className="text-xs font-semibold text-[#E6C27A] font-display uppercase tracking-wider">
                Glory Simon Sourcing & Ownership Analytics
              </h3>
              <p className="text-[10px] text-[#A9A9A9] mt-0.5">Distribution of lead pipelines, site surveys, and quotations across the directory.</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-[#141414]/70 border border-[#D4A65A]/25 text-[9px] font-semibold text-[#E6C27A] uppercase tracking-wider font-display">
              Total Team Members: {profiles.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Widget 1: Sourcing Leads & Projects per Member */}
            <GlassCard className="p-5 bg-[#141414]/30 border-[#D4A65A]/15 flex flex-col justify-between min-h-[260px] text-left">
              <div>
                <h4 className="text-[10px] font-semibold text-[#A9A9A9] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">
                  Leads & Projects Sourced
                </h4>
                <div className="space-y-3.5 mt-4 overflow-y-auto max-h-48 pr-1 kanban-column-scroller">
                  {teamAnalytics.map(member => (
                    <div key={member.id} className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-2">
                        <img src={member.avatar} alt={member.name} className="h-5.5 w-5.5 rounded-full object-cover border border-[#D4A65A]/10" />
                        <span className="font-medium text-white truncate max-w-[100px]">{member.name}</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span className="text-[#A9A9A9]">L: <strong className="text-white">{member.leadsCount}</strong></span>
                        <span className="text-[#D4A65A]">P: <strong className="text-white">{member.projectsCount}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Widget 2: Site Visits & Inspections per Member */}
            <GlassCard className="p-5 bg-[#141414]/30 border-[#D4A65A]/15 flex flex-col justify-between min-h-[260px] text-left">
              <div>
                <h4 className="text-[10px] font-semibold text-[#A9A9A9] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">
                  Site Visits & Inspections
                </h4>
                <div className="space-y-3.5 mt-4 overflow-y-auto max-h-48 pr-1 kanban-column-scroller">
                  {teamAnalytics.map(member => (
                    <div key={member.id} className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-2">
                        <img src={member.avatar} alt={member.name} className="h-5.5 w-5.5 rounded-full object-cover border border-[#D4A65A]/10" />
                        <span className="font-medium text-white truncate max-w-[100px]">{member.name}</span>
                      </span>
                      <span className="font-mono text-[9px] text-[#C76B4F] font-bold">
                        {member.visitsCount} Inspections
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Widget 3: Quotation Sourcing Ownership values */}
            <GlassCard className="p-5 bg-[#141414]/30 border-[#D4A65A]/15 flex flex-col justify-between min-h-[260px] text-left">
              <div>
                <h4 className="text-[10px] font-semibold text-[#A9A9A9] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">
                  Quotation Ownership Ledger
                </h4>
                <div className="space-y-3.5 mt-4 overflow-y-auto max-h-48 pr-1 kanban-column-scroller">
                  {teamAnalytics.map(member => (
                    <div key={member.id} className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-2">
                        <img src={member.avatar} alt={member.name} className="h-5.5 w-5.5 rounded-full object-cover border border-[#D4A65A]/10" />
                        <span className="font-medium text-white truncate max-w-[100px]">{member.name}</span>
                      </span>
                      <span className="font-mono text-[9px] text-[#5D8A72] font-semibold">
                        ₹{member.quotesValue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Widget 4: Recent Sourcing Assignments Log */}
            <GlassCard className="p-5 bg-[#141414]/30 border-[#D4A65A]/15 flex flex-col justify-between min-h-[260px] text-left">
              <div>
                <h4 className="text-[10px] font-semibold text-[#A9A9A9] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-2">
                  Recent Sourcing Assignments
                </h4>
                <div className="space-y-3.5 mt-4 overflow-y-auto max-h-48 pr-1 font-display kanban-column-scroller">
                  {recentAssignmentsList.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 border-b border-white/5 pb-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-white truncate max-w-[110px]">{item.title}</span>
                        <span className="px-1.5 py-0.2 bg-[#D4A65A]/10 text-[#D4A65A] rounded font-mono text-[7px] uppercase tracking-wider">{item.type}</span>
                      </div>
                      <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-mono">
                        <span>{item.target}</span>
                        <span className="text-white font-medium">{item.member}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

          </div>
        </motion.div>

        {/* 5. Recent Client Activity Feed Panel */}
        <motion.div variants={itemFade}>
          <GlassCard className="p-8 bg-[#141414]/30 border-[#D4A65A]/15 shadow-soft-luxe">
            <h4 className="text-xs font-semibold text-[#E6C27A] tracking-widest uppercase font-display border-b border-[#D4A65A]/10 pb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#C76B4F]" /> Recent Sourcing Activity Log
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {activityList.map(act => (
                <div key={act.id} className="p-4 rounded-xl border border-[#D4A65A]/10 bg-[#141414]/40 flex flex-col justify-between h-24 hover:border-[#D4A65A]/30 transition-all text-left">
                  <div>
                    <span className="text-[10px] font-semibold text-white block">{act.user}</span>
                    <span className="text-[10.5px] text-[#A9A9A9] font-light block mt-1 line-clamp-2 leading-relaxed">{act.detail}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-[#D4A65A]/5 pt-2">
                    <span className="text-[8px] text-[#A9A9A9]/50 font-mono">{act.time}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#D4A65A]/50 animate-none" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default DashboardPage;
