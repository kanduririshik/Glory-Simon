import React, { useState, useMemo } from 'react';
import { Download, FileText, BarChart2, Database, TrendingUp } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useNotifications } from '../context/NotificationContext';
import { GlassCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { exportService } from '../services/exportService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ReportsPage: React.FC = () => {
  const { enquiries, siteVisits, quotations } = useCRM();
  const { addToast } = useNotifications();

  // Active Report Tab: 'leads' | 'conversions' | 'revenue' | 'visits'
  const [activeReport, setActiveReport] = useState<'leads' | 'conversions' | 'revenue' | 'visits'>('leads');

  // Calculations: Budget sums per Style
  const styleStatsData = useMemo(() => {
    const map: Record<string, number> = { Modern: 0, Luxury: 0, Contemporary: 0, Minimalist: 0, Traditional: 0 };
    enquiries.forEach(e => {
      if (e.status !== 'Lost') {
        map[e.preferredStyle] = (map[e.preferredStyle] || 0) + e.budget;
      }
    });
    return Object.entries(map).map(([style, budget]) => ({ name: style, budget }));
  }, [enquiries]);

  const handleExport = async (format: 'CSV' | 'Excel' | 'PDF') => {
    addToast('Initializing Export', `Generating simulated ${format} document...`, 'info');
    
    // Sourcing raw data based on current tab selection
    let dataToExport: any[] = [];
    let filename = `GlorySimon_${activeReport}`;

    if (activeReport === 'leads') {
      dataToExport = enquiries;
    } else if (activeReport === 'visits') {
      dataToExport = siteVisits;
    } else if (activeReport === 'revenue') {
      dataToExport = quotations;
    } else {
      dataToExport = enquiries.map(e => ({ name: e.clientName, budget: e.budget, stage: e.status }));
    }

    try {
      if (format === 'CSV') {
        await exportService.exportToCSV(filename, dataToExport);
        addToast('Export Complete', `Downloaded ${filename}.csv successfully.`, 'success');
      } else if (format === 'Excel') {
        await exportService.exportToExcel(filename, dataToExport);
        addToast('Export Complete', `Downloaded ${filename}.xlsx successfully.`, 'success');
      } else {
        await exportService.exportToPDF(filename, dataToExport);
        addToast('Export Complete', `Downloaded ${filename}.pdf successfully.`, 'success');
      }
    } catch (e) {
      addToast('Export Failed', 'An error occurred during formatting.', 'error');
    }
  };

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden text-left font-sans">
      
      {/* Cinematic Hero Header */}
      <div className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-[#D4A65A]/15 bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=90" 
            alt="Executive boardroom mockup" 
            className="w-full h-full object-cover brightness-[30%] filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0A0A0A]/40 to-[#0A0A0A]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-radial from-[#D4A65A]/5 to-transparent pointer-events-none filter blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-4">
          <span className="text-xxs tracking-[0.5em] text-[#E6C27A] uppercase font-bold block font-sans">System Audits</span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight">Reports & Ledger</h1>
          <p className="text-xs md:text-sm text-[#CBBEAB] max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Audit financial statements, export contract documents, and view lead stage conversions logs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
        
        {/* Export options and Tab list */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#D4A65A]/10 pb-6">
          
          <div className="flex bg-[#111111] border border-[#D4A65A]/20 rounded-full p-0.5 font-sans text-[9px] tracking-wider uppercase font-bold">
            {[
              { id: 'leads', label: 'Leads Register' },
              { id: 'conversions', label: 'Conversions Summary' },
              { id: 'revenue', label: 'Revenue Ledger' },
              { id: 'visits', label: 'Inspections' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id as any)}
                className={`px-4.5 py-2 rounded-full cursor-pointer transition-all border ${
                  activeReport === tab.id 
                    ? 'bg-[#D4A65A]/15 text-[#E6C27A] border-[#D4A65A]/25 font-bold shadow-lg' 
                    : 'text-[#CBBEAB] hover:text-white border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="glass" size="sm" onClick={() => handleExport('CSV')} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
              <Download className="h-3.5 w-3.5 text-[#D4A65A]" /> Export CSV
            </Button>
            <Button variant="glass" size="sm" onClick={() => handleExport('Excel')} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
              <FileText className="h-3.5 w-3.5 text-[#D4A65A]" /> Export Excel
            </Button>
            <Button variant="glass" size="sm" onClick={() => handleExport('PDF')} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
              <BarChart2 className="h-3.5 w-3.5 text-[#D4A65A]" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Grid: charts and previews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Style Stats Chart */}
          <div className="lg:col-span-4 flex flex-col">
            <GlassCard hoverEffect={false} className="p-8 h-full bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white font-sans uppercase tracking-widest border-b border-[#D4A65A]/10 pb-3 flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-[#D4A65A]" /> Sourcing Aesthetic Ratios
                </h3>
                <p className="text-[10px] text-[#CBBEAB] mt-2 font-light">Budget distributions mapped to style preferences.</p>
                
                <div className="h-64 w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={styleStatsData} layout="vertical" margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis type="number" stroke="#CBBEAB" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                      <YAxis type="category" dataKey="name" stroke="#CBBEAB" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(212,166,90,0.25)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff', fontSize: 11 }}
                        labelStyle={{ color: '#E6C27A' }}
                        formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Pipeline']}
                      />
                      <Bar dataKey="budget" fill="#D4A65A" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Data Preview Ledger */}
          <div className="lg:col-span-8 flex flex-col">
            <GlassCard hoverEffect={false} className="p-8 h-full bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe flex flex-col justify-between">
              <div className="space-y-6 flex-grow">
                <h3 className="text-xs font-semibold text-white font-sans uppercase tracking-widest flex items-center gap-2 border-b border-[#D4A65A]/10 pb-3">
                  <Database className="h-4.5 w-4.5 text-[#D99A6C]" /> Report Preview Ledger
                </h3>
                
                <div className="overflow-x-auto rounded-xl border border-[#D4A65A]/15 bg-[#0A0A0A]">
                  {activeReport === 'leads' && (
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-[#D4A65A]/25 bg-[#0A0A0A] text-[#D4A65A] text-[9.5px] uppercase tracking-wider">
                          <th className="p-4">Client</th>
                          <th className="p-4">Typology</th>
                          <th className="p-4">Budget</th>
                          <th className="p-4">Source</th>
                          <th className="p-4 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D4A65A]/10 text-[#CBBEAB]">
                        {enquiries.slice(0, 6).map(e => (
                          <tr key={e.id} className="hover:bg-[#D4A65A]/2 transition-colors">
                            <td className="p-4 font-semibold text-[#F5F1EA]">{e.clientName}</td>
                            <td className="p-4 text-[#CBBEAB]/80">{e.projectType}</td>
                            <td className="p-4 font-mono font-semibold text-[#D4A65A]">₹{e.budget.toLocaleString()}</td>
                            <td className="p-4">{e.leadSource}</td>
                            <td className="p-4 text-right text-[#CBBEAB]/50 font-mono">{new Date(e.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeReport === 'conversions' && (
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-[#D4A65A]/25 bg-[#0A0A0A] text-[#D4A65A] text-[9.5px] uppercase tracking-wider">
                          <th className="p-4">Client Name</th>
                          <th className="p-4">Budget</th>
                          <th className="p-4">Lead Score</th>
                          <th className="p-4 text-right">Workflow Stage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D4A65A]/10 text-[#CBBEAB]">
                        {enquiries.slice(0, 6).map(e => {
                          const score = e.budget > 500000 ? 95 : e.budget > 250000 ? 82 : 65;
                          return (
                            <tr key={e.id} className="hover:bg-[#D4A65A]/2 transition-colors">
                              <td className="p-4 font-semibold text-[#F5F1EA]">{e.clientName}</td>
                              <td className="p-4 font-mono text-[#F5F1EA]">₹{e.budget.toLocaleString()}</td>
                              <td className="p-4 font-mono font-semibold text-[#9BCF8A]">{score}/100</td>
                              <td className="p-4 text-right font-mono">
                                <span className="px-2.5 py-0.5 rounded bg-[#D4A65A]/10 border border-[#D4A65A]/20 text-[#E6C27A] text-[9px] tracking-wide uppercase font-bold">{e.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {activeReport === 'revenue' && (
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-[#D4A65A]/25 bg-[#0A0A0A] text-[#D4A65A] text-[9.5px] uppercase tracking-wider">
                          <th className="p-4">Proposal No</th>
                          <th className="p-4">Client</th>
                          <th className="p-4">Invoice Amount</th>
                          <th className="p-4 text-right">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D4A65A]/10 text-[#CBBEAB]">
                        {quotations.slice(0, 6).map(q => (
                          <tr key={q.id} className="hover:bg-[#D4A65A]/2 transition-colors">
                            <td className="p-4 font-semibold text-[#F5F1EA] font-mono">{q.quotationNumber}</td>
                            <td className="p-4 text-[#CBBEAB]/80">
                              {enquiries.find(e => e.id === q.enquiryId)?.clientName || 'Unknown'}
                            </td>
                            <td className="p-4 font-mono font-semibold text-[#D4A65A]">₹{q.amount.toLocaleString()}</td>
                            <td className="p-4 text-right font-mono">
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                                q.status === 'Approved' ? 'bg-emerald-950/30 text-[#9BCF8A] border border-emerald-500/15' : 'bg-[#171717] text-[#CBBEAB] border border-white/5'
                              }`}>
                                {q.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeReport === 'visits' && (
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-[#D4A65A]/25 bg-[#0A0A0A] text-[#D4A65A] text-[9.5px] uppercase tracking-wider">
                          <th className="p-4">Client</th>
                          <th className="p-4">Scheduled At</th>
                          <th className="p-4">Findings</th>
                          <th className="p-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D4A65A]/10 text-[#CBBEAB] font-sans">
                        {siteVisits.slice(0, 6).map(v => (
                          <tr key={v.id} className="hover:bg-[#D4A65A]/2 transition-colors">
                            <td className="p-4 font-semibold text-[#F5F1EA] font-sans">
                              {enquiries.find(e => e.id === v.enquiryId)?.clientName || 'Unknown'}
                            </td>
                            <td className="p-4 font-mono text-[#CBBEAB]/80">{new Date(v.scheduledAt).toLocaleDateString()}</td>
                            <td className="p-4 truncate max-w-[120px] text-[#CBBEAB]/60" title={v.notes}>{v.notes || 'Routine Site Visit'}</td>
                            <td className="p-4 text-right font-mono">
                              <span className="px-2 py-0.5 rounded bg-[#D4A65A]/10 text-[#E6C27A] text-[9px] border border-[#D4A65A]/20 uppercase font-bold tracking-wider">
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReportsPage;
