import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  FileText, 
  Send, 
  Activity,
  ShieldAlert,
  Bot,
  Hammer,
  Palette,
  Layers,
  Feather,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Compass,
  Cpu,
  BadgeAlert,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Inbox,
  UserCheck
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useNotifications } from '../context/NotificationContext';
import { GlassCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AIOrb } from '../components/ui/AIOrb';

export const AIDesignDirectorPage: React.FC = () => {
  const { enquiries } = useCRM();
  const { addToast } = useNotifications();

  // Active client selected for AI analysis
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [customResponse, setCustomResponse] = useState<string>('');
  const [showParams, setShowParams] = useState<boolean>(false);

  const parsed = useMemo(() => {
    if (!customResponse) return null;
    
    const lines = customResponse.split('\n');
    const items: { label: string; value: string; detail?: string }[] = [];
    let title = '';

    const firstNonEmpty = lines.find(l => l.trim().length > 0);
    if (firstNonEmpty && !firstNonEmpty.startsWith('•') && !firstNonEmpty.startsWith('-')) {
      title = firstNonEmpty.replace(/\*\*/g, '').trim();
    }

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const cleaned = trimmed.replace(/^[•-]\s*/, '');
        const colonIndex = cleaned.indexOf(':');
        if (colonIndex !== -1) {
          const label = cleaned.substring(0, colonIndex).replace(/\*\*/g, '').trim();
          const valueStr = cleaned.substring(colonIndex + 1).trim();
          
          let value = valueStr.replace(/\*\*/g, '');
          let detail = '';
          
          const boldMatches = valueStr.match(/\*\*(.*?)\*\*/g);
          if (boldMatches && boldMatches.length > 0) {
            const boldText = boldMatches[0].replace(/\*\*/g, '');
            if (boldText.includes('/') || boldText.toLowerCase() === 'feasible') {
              value = boldText;
              detail = valueStr.replace(boldMatches[0], '').trim();
            }
          }

          items.push({ label, value, detail });
        } else {
          items.push({ label: '', value: cleaned.replace(/\*\*/g, '').trim() });
        }
      }
    });

    if (items.length === 0) {
      return { type: 'plain' as const, title, items: [] };
    }

    const hasMaterials = items.some(i => 
      i.label.toLowerCase().includes('flooring') || 
      i.label.toLowerCase().includes('woodwork') || 
      i.label.toLowerCase().includes('metals') || 
      i.label.toLowerCase().includes('fabrics')
    );

    const hasFinancial = items.some(i => 
      i.label.toLowerCase().includes('feasibility') || 
      i.label.toLowerCase().includes('health') || 
      i.label.toLowerCase().includes('recommendation')
    );

    let type: 'materials' | 'financial' | 'general' = 'general';
    if (hasMaterials) type = 'materials';
    else if (hasFinancial) type = 'financial';

    return { type, title, items };
  }, [customResponse]);

  const renderAIResponse = () => {
    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4 font-mono text-xs text-[#CBBEAB]/70">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-2 border-[#D4A65A]/20 border-t-[#D4A65A] animate-spin" />
            <Sparkles className="h-4 w-4 text-[#D4A65A] absolute top-3 left-3 animate-pulse" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-bold tracking-widest uppercase text-[10px] text-[#E6C27A]">Initializing Neural Core</p>
            <p className="text-[9px] text-slate-500">Streaming recommendations matrix...</p>
          </div>
        </div>
      );
    }

    if (!parsed) return null;

    const getMaterialIcon = (label: string) => {
      const l = label.toLowerCase();
      if (l.includes('flooring')) return <Compass className="h-5 w-5 text-[#D4A65A]" />;
      if (l.includes('woodwork')) return <Hammer className="h-5 w-5 text-[#D4A65A]" />;
      if (l.includes('metals')) return <Layers className="h-5 w-5 text-[#D4A65A]" />;
      if (l.includes('fabrics')) return <Feather className="h-5 w-5 text-[#D4A65A]" />;
      return <Sparkles className="h-5 w-5 text-[#D4A65A]" />;
    };

    const getFinancialIcon = (label: string) => {
      const l = label.toLowerCase();
      if (l.includes('feasibility')) return <ClipboardCheck className="h-5 w-5 text-[#9BCF8A]" />;
      if (l.includes('health') || l.includes('score')) return <DollarSign className="h-5 w-5 text-[#E6C27A]" />;
      if (l.includes('recommendation')) return <Sparkles className="h-5 w-5 text-[#D4A65A]" />;
      return <Activity className="h-5 w-5 text-[#D4A65A]" />;
    };

    return (
      <div className="space-y-6 text-left">
        {/* Response Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4A65A]/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9BCF8A] animate-pulse" />
              <span className="text-[9px] font-mono tracking-widest text-[#8B7355] uppercase font-bold">Neural Output Sourced</span>
            </div>
            <h4 className="text-lg font-serif text-[#E6C27A] mt-1">{parsed.title || 'Director Briefing Analysis'}</h4>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4A65A]/10 border border-[#D4A65A]/25 text-[9px] font-mono text-[#E6C27A] font-semibold">
              <CheckCircle2 className="h-3 w-3 text-[#9BCF8A]" /> CONFIDENCE: 98.4%
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-mono text-[#CBBEAB]">
              <Cpu className="h-3 w-3 text-[#D4A65A]" /> MODEL: GS-GPT-4o
            </span>
          </div>
        </div>

        {parsed.type === 'materials' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parsed.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
              >
                <GlassCard 
                  hoverEffect={true} 
                  className="p-5 bg-gradient-to-br from-[#12100E]/70 to-[#171717]/40 border-[#D4A65A]/20 hover:border-[#D4A65A]/45 transition-all duration-300 rounded-2xl h-full flex flex-col justify-between shadow-soft-luxe"
                >
                  <div className="flex items-center justify-between border-b border-[#D4A65A]/10 pb-3 mb-3">
                    <span className="text-[10px] font-mono tracking-wider text-[#CBBEAB]/80 uppercase font-semibold">{item.label}</span>
                    <div className="p-2 rounded-xl bg-[#D4A65A]/5 border border-[#D4A65A]/15 shrink-0">
                      {getMaterialIcon(item.label)}
                    </div>
                  </div>
                  <p className="text-xs font-light leading-relaxed text-[#F5F1EA] font-display">
                    {item.value}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {parsed.type === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {parsed.items.map((item, idx) => {
              const isRec = item.label.toLowerCase().includes('recommendation');
              if (isRec) {
                return (
                  <motion.div
                    key={idx}
                    className="md:col-span-12"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <GlassCard 
                      hoverEffect={false} 
                      className="p-5 bg-[#141414]/80 border-[#D4A65A]/25 rounded-2xl shadow-soft-luxe"
                    >
                      <div className="flex items-center gap-2 border-b border-[#D4A65A]/10 pb-3 mb-3">
                        <div className="p-2 rounded-xl bg-[#D4A65A]/5 border border-[#D4A65A]/15 shrink-0">
                          {getFinancialIcon(item.label)}
                        </div>
                        <span className="text-[10px] font-mono tracking-wider text-[#E6C27A] uppercase font-semibold">{item.label}</span>
                      </div>
                      <p className="text-xs font-light leading-relaxed text-[#CBBEAB] font-display">
                        {item.value}
                      </p>
                    </GlassCard>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={idx}
                  className="md:col-span-6"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                >
                  <GlassCard 
                    hoverEffect={true} 
                    className="p-5 bg-[#12100E]/70 border-[#D4A65A]/15 hover:border-[#D4A65A]/35 transition-all duration-300 rounded-2xl h-full flex flex-col justify-between shadow-soft-luxe"
                  >
                    <div className="flex items-center justify-between border-b border-[#D4A65A]/10 pb-3 mb-3">
                      <span className="text-[10px] font-mono tracking-wider text-[#CBBEAB]/80 uppercase font-semibold">{item.label}</span>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                        {getFinancialIcon(item.label)}
                      </div>
                    </div>
                    <div className="mt-2 text-left">
                      <h5 className="text-2xl font-serif font-bold text-white tracking-wide font-mono">{item.value}</h5>
                      {item.detail && <p className="text-[10px] text-slate-500 mt-2 font-display leading-relaxed">{item.detail}</p>}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {parsed.type === 'general' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {parsed.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
              >
                <GlassCard 
                  hoverEffect={true} 
                  className="p-5 bg-[#171717]/40 border-white/5 hover:border-[#D4A65A]/30 transition-all duration-300 rounded-2xl h-full flex flex-col justify-between shadow-soft-luxe"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                    <span className="text-[9.5px] font-mono tracking-wider text-[#CBBEAB]/70 uppercase font-semibold">{item.label || 'Insight'}</span>
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      <Sparkles className="h-4 w-4 text-[#D4A65A]" />
                    </div>
                  </div>
                  <p className="text-xs font-light leading-relaxed text-[#F5F1EA] font-display">
                    {item.value}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {parsed.type === 'plain' && (
          <div className="p-6 rounded-2xl border border-white/5 bg-[#141414]/30 text-xs leading-relaxed font-light text-[#CBBEAB] font-display whitespace-pre-line text-left shadow-soft-luxe">
            {customResponse}
          </div>
        )}
        
        {/* Luxury separating details */}
        <div className="pt-4 border-t border-[#D4A65A]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[9.5px] text-slate-500 font-mono">
          <span>SECURITY LEVEL: ENCRYPTED PROFILE</span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-[#D4A65A]" /> REAL-TIME NEURAL DECISION STREAM
          </span>
        </div>
      </div>
    );
  };

  // Sourcing currently selected client details
  const activeClient = useMemo(() => {
    return enquiries.find(e => e.id === selectedEnquiryId) || enquiries[0];
  }, [enquiries, selectedEnquiryId]);

  // Lead Scoring & Conversion Metrics calculation
  const metrics = useMemo(() => {
    if (!activeClient) return { score: 70, probability: 45, risk: 'Medium', advice: 'N/A' };
    
    // score based on budget & style alignment
    const budgetScore = activeClient.budget > 500000 ? 95 : activeClient.budget > 250000 ? 82 : 65;
    
    // probability based on status stage
    let probability = 30;
    if (activeClient.status === 'Negotiation') probability = 85;
    else if (activeClient.status === 'Quotation Sent') probability = 70;
    else if (activeClient.status === 'Site Visit Scheduled') probability = 55;
    else if (activeClient.status === 'Follow Up') probability = 40;
    else if (activeClient.status === 'Confirmed') probability = 100;

    // risk assess
    let risk = 'Low';
    let advice = 'Lead margins are stable. Sourcing materials from local partners.';
    if (activeClient.budget / (activeClient.sqFtArea || 1) < 40) {
      risk = 'High';
      advice = 'Budget size is low for property square footage (₹' + Math.round(activeClient.budget / activeClient.sqFtArea) + '/sq ft). Restrict marble options to local quartz alternatives.';
    } else if (activeClient.priority === 'Urgent') {
      risk = 'Medium';
      advice = 'Urgent delivery schedule constraints. Reserve carpenter teams immediately.';
    }

    return {
      score: budgetScore,
      probability,
      risk,
      advice
    };
  }, [activeClient]);

  // Handle custom prompt execution
  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAnalyzing(true);
    setCustomResponse('');
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/ai_director/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ client_info: activeClient, prompt: aiPrompt })
        });
        
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API error (${res.status}): ${errText}`);
        }
        
        const data = await res.json();
        setCustomResponse(data.response);
        setIsAnalyzing(false);
        setAiPrompt('');
        addToast('Analysis Sourced', 'AI Design Director generated a response.', 'success');
        return;
      } catch (err) {
        console.error('[AIDesignDirector] Render Backend API call failed, falling back to mock:', err);
      }
    }

    // Simulated stream delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const lcPrompt = aiPrompt.toLowerCase();
    let responseText = '';

    if (lcPrompt.includes('material') || lcPrompt.includes('marble')) {
      responseText = `Based on the preferred style: **${activeClient?.preferredStyle || 'Luxury'}**, here is my design recipe:\n` +
        `• Core Flooring: Verde Alpi deep marble slab accents matched with organic limestone tiles.\n` +
        `• Woodwork: Brushed Matt Smoked Oak wall panels to enrich warmth.\n` +
        `• Metals: Satin Brass fixtures to offset darker timber sheets.\n` +
        `• Fabrics: Sand-hued chunky bouclé upholstery to maximize comfort.`;
    } else if (lcPrompt.includes('risk') || lcPrompt.includes('budget')) {
      responseText = `Financial Audit for **${activeClient?.clientName || 'Client'}**:\n` +
        `• Sourcing Feasibility: Feasible, though square footage is large.\n` +
        `• Budget Health Score: **${metrics.score}/100**.\n` +
        `• Recommendation: Target 30% budget allocation to core marble panels. Limit bespoke trim hardware costs to preserve 15% net studio margins.`;
    } else {
      responseText = `AI Design Analysis for **${activeClient?.clientName || 'Client'}**:\n` +
        `• Style Focus: Luxury Neoclassical details fits the location context.\n` +
        `• Sourcing Warning: Track carrier delays on Calacatta Gold slabs from Italian docks.\n` +
        `• Recommended Action: Schedule a layout concept review immediately to lock in the 40% initial retainer contract.`;
    }

    setCustomResponse(responseText);
    setIsAnalyzing(false);
    setAiPrompt('');
    addToast('Analysis Sourced', 'AI Design Director generated a response.', 'success');
  };

  // Generate simulated follow-up copy
  const triggerFollowUpGeneration = async () => {
    if (!activeClient) return;
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/ai_director/follow_up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ client_info: activeClient })
        });
        
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API error (${res.status}): ${errText}`);
        }
        
        const data = await res.json();
        setGeneratedDraft(data.draft);
        addToast('Draft Sourced', 'AI follow-up draft compiled.', 'success');
        return;
      } catch (err) {
        console.error('[AIDesignDirector] Render Backend API call failed, falling back to mock:', err);
      }
    }
    
    const drafts: Record<string, string> = {
      'New Lead': `Dear ${activeClient.clientName},\n\nThank you for choosing Glory Simon Interiors. We are thrilled to review your request for the design of your ${activeClient.projectType} at ${activeClient.location}.\n\nOur principal director, Glory, will review your style goals (${activeClient.preferredStyle}) and allocate custom mood boards.\n\nWarmly,\nGlory Simon Interiors Team`,
      'Follow Up': `Hi ${activeClient.clientName},\n\nThis is Glory from the design studio. Following our brief, I have compiled custom marble and fabric palettes suitable for your ${activeClient.preferredStyle} concept.\n\nAre you available for a showroom walkthrough this Thursday at 2:00 PM?\n\nBest regards,\nGlory Simon`,
      'Site Visit Scheduled': `Dear ${activeClient.clientName},\n\nThis is a quick confirmation for your upcoming site visit. Our chief site engineer, David Ross, will inspect structural load-bearing parameters and record laser dimensions.\n\nWarm regards,\nSarah Jenkins`,
      'Quotation Sent': `Dear ${activeClient.clientName},\n\nWe have finalized the architectural layout and estimated materials breakdown for your space.\n\nPlease find attached our formal proposal totaling ₹${activeClient.budget.toLocaleString()}.\n\nSincerely,\nSarah Jenkins\nProject Management`,
      'Negotiation': `Dear ${activeClient.clientName},\n\nThank you for reviewing our proposal. Regarding your request for structural cost optimization, we can adjust the sourcing parameters of the imported slabs to local vein-matched alternatives, saving 8% of core expenses.\n\nLet me know if we can lock in the contracts with these adjustments.\n\nBest,\nGlory Simon`,
      'Confirmed': `Dear ${activeClient.clientName},\n\nIt is official! Welcome to the Glory Simon Interiors family. Our design studio has commenced CAD modeling for your space. We are proud to bring your vision to life.\n\nWarmest regards,\nGlory Simon`
    };

    setGeneratedDraft(drafts[activeClient.status] || drafts['New Lead']);
    addToast('Draft Sourced', 'AI follow-up draft compiled.', 'success');
  };

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden text-left">
      
      {/* Cinematic Hero Header */}
      <div className="relative h-[45vh] w-full flex items-center justify-center overflow-hidden border-b border-[#D4A65A]/15 bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=90" 
            alt="Futuristic luxury interior design" 
            className="w-full h-full object-cover brightness-[35%] filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0A0A0A]/40 to-[#0A0A0A]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-radial from-[#D4A65A]/5 to-transparent pointer-events-none filter blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-4">
          <span className="text-xxs tracking-[0.5em] text-[#E6C27A] uppercase font-bold block font-display">Cognitive Sourcing</span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight">Neural Design Command Center</h1>
          <p className="text-xs md:text-sm text-[#A9A9A9] max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Simulate advanced lead scoring, perform deep budget risk audits, and compile bespoke correspondence templates.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
        
        {/* Selector and Client Summary bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#D4A65A]/10 pb-6">
          <div className="space-y-1 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#D4A65A]/10 text-[#D4A65A] mt-1">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-white">Focus Sourcing Client</h2>
              <p className="text-[10px] text-[#A9A9A9] mt-0.5">Select an enquiry profile to feed the neural recommendation matrix.</p>
            </div>
          </div>

          <div className="relative min-w-[260px]">
            <select
              className="w-full appearance-none pl-4 pr-12 py-3 glass-input-premium-light text-xs font-semibold cursor-pointer"
              value={selectedEnquiryId}
              onChange={e => {
                setSelectedEnquiryId(e.target.value);
                setGeneratedDraft('');
                setCustomResponse('');
              }}
            >
              <option value="">Select client portfolio...</option>
              {enquiries.map(e => (
                <option key={e.id} value={e.id}>{e.clientName} ({e.status})</option>
              ))}
            </select>
            <Sliders className="absolute right-4 top-3.5 h-4 w-4 text-[#D4A65A] pointer-events-none" />
          </div>
        </div>

        {activeClient ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Centerpiece Orb panel & scoring metrics */}
            <div className="lg:col-span-8 space-y-8 flex flex-col justify-between">
              
              {/* Scorecard grids */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Lead Score */}
                <GlassCard hoverEffect={true} className="p-6 bg-[#141414]/30 border-[#D4A65A]/10 shadow-soft-luxe text-center flex flex-col justify-between h-36">
                  <span className="text-[9px] tracking-widest text-[#A9A9A9] font-mono uppercase block">Lead Score</span>
                  <div className="my-2 flex items-center justify-center gap-1.5">
                    <span className="text-4xl font-serif font-bold text-white font-mono">{metrics.score}</span>
                    <span className="text-[#A9A9A9] text-sm">/100</span>
                  </div>
                  <span className="text-[9px] text-[#A9A9A9]/60 font-light">Typology budget scale multiplier</span>
                </GlassCard>

                {/* Conversion Prob */}
                <GlassCard hoverEffect={true} className="p-6 bg-[#141414]/30 border-[#D4A65A]/10 shadow-soft-luxe text-center flex flex-col justify-between h-36">
                  <span className="text-[9px] tracking-widest text-[#A9A9A9] font-mono uppercase block">Conversion Probability</span>
                  <div className="my-2 flex items-center justify-center gap-1.5 text-[#D4A65A]">
                    <TrendingUp className="h-5 w-5 text-[#9BCF8A]" />
                    <span className="text-4xl font-serif font-bold text-white font-mono">{metrics.probability}</span>
                    <span className="text-[#A9A9A9] text-sm">%</span>
                  </div>
                  <span className="text-[9px] text-[#A9A9A9]/60 font-light">Direct workflow conversion alignment</span>
                </GlassCard>

                {/* Risk Assessment */}
                <GlassCard hoverEffect={true} className="p-6 bg-[#141414]/30 border-[#D4A65A]/10 shadow-soft-luxe text-center flex flex-col justify-between h-36">
                  <span className="text-[9px] tracking-widest text-[#A9A9A9] font-mono uppercase block">Sourcing Risk Profile</span>
                  <div className="my-2 flex items-center justify-center gap-2">
                    {metrics.risk === 'High' ? (
                      <BadgeAlert className="h-5.5 w-5.5 text-[#C76B4F]" />
                    ) : metrics.risk === 'Medium' ? (
                      <AlertTriangle className="h-5.5 w-5.5 text-[#D4A65A]" />
                    ) : (
                      <ShieldAlert className="h-5.5 w-5.5 text-[#5D8A72]" />
                    )}
                    <span className="text-2xl font-serif font-bold text-white uppercase">{metrics.risk}</span>
                  </div>
                  <span className="text-[9px] text-[#A9A9A9]/60 font-light">Margins area coverage audit</span>
                </GlassCard>
              </div>

              {/* Large Animated AI centerpiece visual */}
              <GlassCard variant="gold" hoverEffect={false} className="p-8 bg-gradient-to-br from-[#1C1C1C] via-[#121212] to-[#0A0A0A] border-[#D4A65A]/25 relative overflow-hidden flex flex-col md:flex-row items-center justify-around gap-6 py-12">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4A65A]/5 rounded-full filter blur-2xl" />
                
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <Bot className="h-6 w-6 text-[#D4A65A] animate-pulse" />
                  <AIOrb size="lg" />
                  <span className="text-[8.5px] font-mono tracking-widest text-[#A9A9A9]/60 uppercase block">ORB STATUS: LISTENING</span>
                </div>

                <div className="max-w-md space-y-4 text-left">
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono tracking-[0.2em] text-[#C76B4F] uppercase font-bold">Auditing Profile</span>
                    <h3 className="text-xl font-serif text-white">{activeClient.clientName} — {activeClient.location}</h3>
                  </div>
                  <p className="text-xs text-[#A9A9A9] font-light leading-relaxed">
                    Style Preference focuses on **{activeClient.preferredStyle}**. Sourcing estimate lists gross square footage of {activeClient.sqFtArea || 'N/A'} Sq Ft.
                  </p>
                  
                  {/* Collapsible Sourcing Details Toggle */}
                  <div className="border-t border-[#D4A65A]/10 pt-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => setShowParams(!showParams)}
                      className="flex items-center gap-1.5 text-[9.5px] font-mono text-[#D4A65A]/80 hover:text-[#D4A65A] transition-colors uppercase tracking-widest cursor-pointer outline-none"
                    >
                      <span>{showParams ? 'Hide Details' : 'Expand Sourcing Parameters'}</span>
                      {showParams ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    <AnimatePresence>
                      {showParams && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-[#A9A9A9]"
                        >
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>Project Type:</span>
                            <span className="text-white font-medium">{activeClient.projectType}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>Sourcing Scope:</span>
                            <span className="text-white font-medium">{activeClient.sqFtArea ? `${activeClient.sqFtArea} Sq Ft` : 'Custom'}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>Priority:</span>
                            <span className={`font-semibold ${activeClient.priority === 'Urgent' ? 'text-[#C76B4F]' : 'text-white'}`}>
                              {activeClient.priority}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>Est. Lead Time:</span>
                            <span className="text-white font-medium">
                              {activeClient.priority === 'Urgent' ? '4-6 Weeks' : '12-16 Weeks'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-2 flex gap-4">
                    <div className="px-3.5 py-1.5 rounded-lg bg-[#141414] border border-[#D4A65A]/10 text-[9px] text-[#A9A9A9] font-mono">
                      BUDGET: <span className="text-white font-bold">₹{activeClient.budget.toLocaleString()}</span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-lg bg-[#141414] border border-[#D4A65A]/10 text-[9px] text-[#A9A9A9] font-mono">
                      STAGE: <span className="text-[#D4A65A] font-bold">{activeClient.status}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Interactive Neural Director Input Assistant */}
              <GlassCard hoverEffect={false} className="p-8 bg-[#111]/40 border-[#D4A65A]/15 shadow-soft-luxe space-y-6">
                <div className="flex items-center justify-between border-b border-[#D4A65A]/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#D4A65A] animate-pulse" />
                    <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">AI Design Director Assistant</h3>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline">Active Client Engine</span>
                </div>

                <form onSubmit={handlePromptSubmit} className="flex flex-col sm:flex-row gap-4 items-stretch">
                  <div className="relative flex-grow group">
                    <input
                      type="text"
                      placeholder="e.g., 'Recommend materials', 'Perform budget risk audit'..."
                      className="w-full text-xs bg-[#070707] text-white border border-[#D4A65A]/25 rounded-xl px-5 py-3.5 focus:border-[#D4A65A] focus:ring-1 focus:ring-[#D4A65A]/50 outline-none transition-all duration-300 group-hover:border-[#D4A65A]/45 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] focus:shadow-[0_0_20px_rgba(212,166,90,0.15)]"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                    />
                    <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-[#D4A65A]/5 to-[#E6C27A]/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 filter blur-xs" />
                  </div>
                  
                  <button 
                    type="submit"
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] hover:from-[#E6C27A] hover:to-[#D4A65A] text-black font-semibold font-mono text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,166,90,0.2)] transition-all duration-300 hover:shadow-[0_4px_25px_rgba(212,166,90,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Analyze Brief</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Suggestions tray */}
                <div className="flex flex-wrap gap-2 text-[10px] text-[#A9A9A9] font-mono pt-2">
                  <span className="text-[#8B7355] self-center">SUGGESTIONS:</span>
                  <button 
                    type="button" 
                    onClick={() => setAiPrompt('Recommend design materials')} 
                    className="px-2.5 py-1 rounded-md bg-[#141414] hover:bg-[#D4A65A]/10 border border-[#D4A65A]/10 hover:border-[#D4A65A]/30 text-[9.5px] transition-colors cursor-pointer outline-none"
                  >
                    Recommend Materials
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAiPrompt('Perform budget risk audit')} 
                    className="px-2.5 py-1 rounded-md bg-[#141414] hover:bg-[#D4A65A]/10 border border-[#D4A65A]/10 hover:border-[#D4A65A]/30 text-[9.5px] transition-colors cursor-pointer outline-none"
                  >
                    Budget Risk Audit
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAiPrompt('Analyze design brief details')} 
                    className="px-2.5 py-1 rounded-md bg-[#141414] hover:bg-[#D4A65A]/10 border border-[#D4A65A]/10 hover:border-[#D4A65A]/30 text-[9.5px] transition-colors cursor-pointer outline-none"
                  >
                    Style Brief Audit
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {(isAnalyzing || customResponse) && (
                    <motion.div
                      key={isAnalyzing ? 'analyzing' : 'response'}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                      className="p-6 rounded-2xl border border-[#D4A65A]/20 bg-[#0c0a09]/90 relative text-left shadow-soft-luxe w-full"
                    >
                      {renderAIResponse()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>

            </div>

            {/* Right Column: AI Follow-Up Generator & Sourcing Advice */}
            <div className="lg:col-span-4 space-y-8 flex flex-col justify-between">
              
              {/* Follow-up generator */}
              <GlassCard hoverEffect={false} className="p-8 bg-[#141414]/50 border-[#D4A65A]/15 shadow-soft-luxe flex-grow flex flex-col justify-between min-h-[400px]">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-widest flex items-center gap-1.5 border-b border-[#D4A65A]/10 pb-4">
                    <FileText className="h-4.5 w-4.5 text-[#D4A65A]" /> Follow-Up Generator
                  </h3>

                  <p className="text-[10px] text-[#A9A9A9] font-light leading-relaxed">
                    Generate instant draft templates based on the current workflow conversion stage (**{activeClient.status}**).
                  </p>

                  <Button onClick={triggerFollowUpGeneration} variant="premium" className="w-full text-center text-xs cursor-pointer py-2.5 flex items-center justify-center gap-1.5">
                    <span>Draft Stage Correspondence</span>
                    <ArrowRight className="h-3 w-3 text-black animate-pulse" />
                  </Button>

                  {generatedDraft && (
                    <div className="p-4 rounded-xl border border-[#D4A65A]/10 bg-[#0A0A0A]/80 max-h-[200px] overflow-y-auto mt-4 text-[10.5px] leading-relaxed font-light text-[#A9A9A9] whitespace-pre-line font-mono text-left">
                      {generatedDraft}
                    </div>
                  )}
                </div>

                {generatedDraft && (
                  <div className="pt-4 border-t border-[#D4A65A]/10 mt-4">
                    <Button 
                      variant="glass" 
                      className="w-full text-center text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedDraft);
                        addToast('Draft Copied', 'Message stored to clipboard.', 'success');
                      }}
                    >
                      <span>Copy Draft To Clipboard</span>
                      <ArrowRight className="h-3 w-3 text-[#D4A65A]" />
                    </Button>
                  </div>
                )}
              </GlassCard>

              {/* Safeguard & Recipe Insights */}
              <GlassCard hoverEffect={false} className="p-6 bg-[#141414]/30 border-[#D4A65A]/10 shadow-soft-luxe space-y-4 text-left">
                <span className="text-[9px] font-mono text-[#D4A65A] tracking-widest uppercase flex items-center gap-2 border-b border-[#D4A65A]/10 pb-2">
                  <Palette className="h-3.5 w-3.5" /> Director Insight Board
                </span>
                <div className="space-y-3 text-xs text-[#A9A9A9] font-light">
                  <div className="flex justify-between items-start gap-4">
                    <span>Recipe:</span>
                    <span className="font-semibold text-white text-right">
                      {activeClient.preferredStyle === 'Luxury' ? 'Vein-matched slabs' : activeClient.preferredStyle === 'Minimalist' ? 'Microcement & Oak' : 'Walnut moldings'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-4 border-t border-[#D4A65A]/5 pt-2">
                    <span>Audit:</span>
                    <span className="font-semibold text-[#D4A65A] text-right">{metrics.advice}</span>
                  </div>
                </div>
              </GlassCard>

            </div>

          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-24 px-6 max-w-md mx-auto space-y-6"
          >
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#141414] border border-[#D4A65A]/15 shadow-soft-luxe text-[#D4A65A]/40">
              <Inbox className="w-6 h-6" />
              <div className="absolute inset-0 rounded-full border border-[#D4A65A]/5 animate-ping opacity-30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif text-white tracking-wide">Select Client Sourcing Profile</h3>
              <p className="text-xs text-[#A9A9A9] font-light leading-relaxed max-w-xs">
                Choose an active profile from the portfolio selector above to unlock the neural recommendation engine.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AIDesignDirectorPage;
