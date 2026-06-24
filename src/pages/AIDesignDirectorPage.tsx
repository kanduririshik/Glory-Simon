import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  FileText, 
  Send, 
  Percent,
  Activity,
  ShieldAlert,
  Bot
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
          <div className="space-y-1">
            <h2 className="text-xl font-serif text-white">Focus Sourcing Client</h2>
            <p className="text-[10px] text-[#A9A9A9]">Select an enquiry profile to feed the neural recommendation matrix.</p>
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
                  <div className="my-2 flex items-center justify-center text-[#D4A65A]">
                    <Percent className="h-4.5 w-4.5 mr-0.5 text-[#D4A65A]" />
                    <span className="text-4xl font-serif font-bold text-white font-mono">{metrics.probability}</span>
                    <span className="text-[#A9A9A9] text-sm">%</span>
                  </div>
                  <span className="text-[9px] text-[#A9A9A9]/60 font-light">Direct workflow conversion alignment</span>
                </GlassCard>

                {/* Risk Assessment */}
                <GlassCard hoverEffect={true} className="p-6 bg-[#141414]/30 border-[#D4A65A]/10 shadow-soft-luxe text-center flex flex-col justify-between h-36">
                  <span className="text-[9px] tracking-widest text-[#A9A9A9] font-mono uppercase block">Sourcing Risk Profile</span>
                  <div className="my-2 flex items-center justify-center gap-2">
                    <ShieldAlert className={`h-5.5 w-5.5 ${metrics.risk === 'High' ? 'text-[#C76B4F]' : metrics.risk === 'Medium' ? 'text-[#D4A65A]' : 'text-[#5D8A72]'}`} />
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
              <GlassCard hoverEffect={false} className="p-8 bg-[#141414]/30 border-[#D4A65A]/15 shadow-soft-luxe space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4A65A]/10 pb-4">
                  <Activity className="h-4 w-4 text-[#D4A65A] animate-pulse" />
                  <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Ask AI Design Director Assistant</h3>
                </div>

                <form onSubmit={handlePromptSubmit} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. 'Recommend materials' or 'Perform budget risk audit'..."
                    className="flex-grow glass-input-premium-light text-xs bg-black/40 text-white focus:bg-black/80"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                  />
                  <Button type="submit" variant="gold" className="cursor-pointer px-6">
                    Analyze <Send className="h-3 w-3 ml-1" />
                  </Button>
                </form>

                <AnimatePresence mode="wait">
                  {(isAnalyzing || customResponse) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-2xl border border-[#D4A65A]/20 bg-[#1C1C1C]/80 text-xs leading-relaxed font-light text-[#A9A9A9] whitespace-pre-line relative text-left"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2 text-[#A9A9A9] font-mono">
                          <span className="h-2 w-2 rounded-full bg-[#D4A65A] animate-ping" />
                          <span>Streaming neural recommendations matrix...</span>
                        </div>
                      ) : (
                        <div className="text-white whitespace-pre-line">
                          {customResponse}
                        </div>
                      )}
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

                  <Button onClick={triggerFollowUpGeneration} variant="premium" className="w-full text-center text-xs cursor-pointer py-2.5">
                    Draft Stage Correspondence
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
                      className="w-full text-center text-[10px] cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedDraft);
                        addToast('Draft Copied', 'Message stored to clipboard.', 'success');
                      }}
                    >
                      Copy Draft To Clipboard
                    </Button>
                  </div>
                )}
              </GlassCard>

              {/* Safeguard & Recipe Insights */}
              <GlassCard hoverEffect={false} className="p-6 bg-[#141414]/30 border-[#D4A65A]/10 shadow-soft-luxe space-y-4 text-left">
                <span className="text-[9px] font-mono text-[#D4A65A] tracking-widest uppercase block border-b border-[#D4A65A]/10 pb-2">Director Insight Board</span>
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
          <div className="text-center py-20 text-[#A9A9A9] text-xs font-display">
            Please select a client from the dropdown menu to trigger the AI Design Director.
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignDirectorPage;
