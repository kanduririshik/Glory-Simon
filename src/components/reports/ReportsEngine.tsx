import React, { useState, useMemo } from 'react';
import { Download, FileText, BarChart2, Database } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useNotifications } from '../../context/NotificationContext';
import { GlassCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ReportsEngine: React.FC = () => {
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

  // CSV Export Helper
  const triggerCsvDownload = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('Report Exported', `Downloaded ${filename}.csv successfully.`, 'success');
  };

  const handleExport = (format: 'CSV' | 'Excel' | 'PDF') => {
    if (format === 'PDF') {
      window.print();
      return;
    }

    if (activeReport === 'leads') {
      const headers = ['Client Name', 'Email', 'Phone', 'Project Type', 'Location', 'Budget', 'Style', 'Source', 'Priority', 'Status', 'Registry Date'];
      const rows = enquiries.map(e => [
        e.clientName,
        e.email || '',
        e.phoneNumber || '',
        e.projectType,
        e.location,
        e.budget.toString(),
        e.preferredStyle,
        e.leadSource,
        e.priority,
        e.status,
        new Date(e.createdAt).toLocaleDateString()
      ]);
      triggerCsvDownload(`GlorySimon_LeadsReport_${new Date().toISOString().split('T')[0]}`, headers, rows);
    } else if (activeReport === 'visits') {
      const headers = ['Client Name', 'Scheduled Date', 'Status', 'Directives'];
      const rows = siteVisits.map(v => {
        const client = enquiries.find(e => e.id === v.enquiryId);
        return [
          client?.clientName || 'Unknown',
          new Date(v.scheduledAt).toLocaleString(),
          v.status,
          v.notes || ''
        ];
      });
      triggerCsvDownload(`GlorySimon_SiteVisits_${new Date().toISOString().split('T')[0]}`, headers, rows);
    } else if (activeReport === 'revenue') {
      const headers = ['Quotation No', 'Client Name', 'Total Amount', 'Status', 'Created Date'];
      const rows = quotations.map(q => {
        const client = enquiries.find(e => e.id === q.enquiryId);
        return [
          q.quotationNumber,
          client?.clientName || 'Unknown',
          q.amount.toString(),
          q.status,
          new Date(q.createdAt).toLocaleDateString()
        ];
      });
      triggerCsvDownload(`GlorySimon_RevenueProposals_${new Date().toISOString().split('T')[0]}`, headers, rows);
    } else {
      // Conversions
      const headers = ['Client Name', 'Project Type', 'Budget', 'Lead Score', 'Workflow Stage'];
      const rows = enquiries.map(e => {
        const score = e.budget > 500000 ? '95' : e.budget > 250000 ? '82' : '65';
        return [
          e.clientName,
          e.projectType,
          e.budget.toString(),
          score,
          e.status
        ];
      });
      triggerCsvDownload(`GlorySimon_ConversionsSummary_${new Date().toISOString().split('T')[0]}`, headers, rows);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D4A65A]/15 pb-4">
        <div>
          <span className="text-xxs tracking-widest text-[#8B7355] uppercase font-semibold font-display">system audits</span>
          <h1 className="text-3xl serif-editorial font-medium text-luxe-primary tracking-tight mt-1">Reports & Ledger</h1>
        </div>
        
        {/* Export options */}
        <div className="flex flex-wrap gap-2">
          <Button variant="glass" size="sm" onClick={() => handleExport('CSV')} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="glass" size="sm" onClick={() => handleExport('Excel')} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <FileText className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button variant="glass" size="sm" onClick={() => handleExport('PDF')} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <BarChart2 className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-luxury-bg-sec/40 border border-white/5 rounded-2xl p-0.5 w-full md:w-fit font-display text-xs shadow-sm">
        {[
          { id: 'leads', label: 'Leads Register' },
          { id: 'conversions', label: 'Conversions Summary' },
          { id: 'revenue', label: 'Revenue Ledger' },
          { id: 'visits', label: 'Inspections' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-4 py-2 rounded-xl cursor-pointer transition-colors ${
              activeReport === tab.id 
                ? 'bg-[#D4A65A] text-black font-semibold shadow-md' 
                : 'text-slate-400 hover:text-luxe-primary font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid: charts and previews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Style Stats Chart */}
        <GlassCard hoverEffect={false} className="p-5 lg:col-span-1 flex flex-col justify-between border-[#D4A65A]/10 glass-premium-light shadow-soft-luxe">
          <div>
            <h3 className="text-sm font-semibold text-luxe-title font-display">Aesthetic Sourcing Ratios</h3>
            <p className="text-xxs text-slate-500 mt-0.5">Budget distributions mapped to style preferences.</p>
            
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={styleStatsData} layout="vertical" margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis type="number" stroke="#8B7355" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                  <YAxis type="category" dataKey="name" stroke="#8B7355" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(212,166,90,0.25)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#F8F6F0', fontSize: 11 }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Pipeline']}
                  />
                  <Bar dataKey="budget" fill="#D4A65A" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Data Preview Ledger */}
        <GlassCard hoverEffect={false} className="p-5 lg:col-span-2 space-y-4 border-[#D4A65A]/10 glass-premium-light shadow-soft-luxe">
          <h3 className="text-sm font-semibold text-luxe-title font-display flex items-center gap-1.5">
            <Database className="h-4 w-4 text-[#D4A65A]" /> Report Preview Ledger
          </h3>
          
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#141414]/30">
            {activeReport === 'leads' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#D4A65A]/10 text-luxe-secondary font-semibold font-display">
                    <th className="p-3">Client</th>
                    <th className="p-3">Typology</th>
                    <th className="p-3">Budget</th>
                    <th className="p-3">Source</th>
                    <th className="p-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {enquiries.slice(0, 6).map(e => (
                    <tr key={e.id}>
                      <td className="p-3 font-semibold text-luxe-label">{e.clientName}</td>
                      <td className="p-3 text-slate-400">{e.projectType}</td>
                      <td className="p-3 font-mono font-semibold text-[#D4A65A]">${e.budget.toLocaleString()}</td>
                      <td className="p-3">{e.leadSource}</td>
                      <td className="p-3 text-right text-slate-400 font-mono">{new Date(e.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'conversions' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#D4A65A]/10 text-luxe-secondary font-semibold font-display">
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Budget</th>
                    <th className="p-3">Lead Score</th>
                    <th className="p-3 text-right">Workflow Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {enquiries.slice(0, 6).map(e => {
                    const score = e.budget > 500000 ? 95 : e.budget > 250000 ? 82 : 65;
                    return (
                      <tr key={e.id}>
                        <td className="p-3 font-semibold text-luxe-label">{e.clientName}</td>
                        <td className="p-3 font-mono">${e.budget.toLocaleString()}</td>
                        <td className="p-3 font-mono font-semibold text-[#4E7A65]">{score}/100</td>
                        <td className="p-3 text-right font-display">
                          <span className="px-2 py-0.5 rounded bg-[#D4A65A]/10 border border-[#D4A65A]/20 text-[#8B7355] text-[10px]">{e.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeReport === 'revenue' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#D4A65A]/10 text-luxe-secondary font-semibold font-display">
                    <th className="p-3">Proposal No</th>
                    <th className="p-3">Client</th>
                    <th className="p-3 font-mono">Invoice Amount</th>
                    <th className="p-3 text-right">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {quotations.slice(0, 6).map(q => (
                    <tr key={q.id}>
                      <td className="p-3 font-semibold text-luxe-label font-mono">{q.quotationNumber}</td>
                      <td className="p-3 text-slate-400">
                        {enquiries.find(e => e.id === q.enquiryId)?.clientName || 'Unknown'}
                      </td>
                      <td className="p-3 font-mono font-semibold text-[#D4A65A]">${q.amount.toLocaleString()}</td>
                      <td className="p-3 text-right font-display">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                          q.status === 'Approved' ? 'bg-[#4E7A65]/10 text-[#4E7A65] border border-[#4E7A65]/20 font-bold' : 'bg-[#141414]/60 text-slate-400 border border-white/5'
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
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#D4A65A]/10 text-luxe-secondary font-semibold font-display">
                    <th className="p-3">Client</th>
                    <th className="p-3">Scheduled At</th>
                    <th className="p-3">Findings</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-sans">
                  {siteVisits.slice(0, 6).map(v => (
                    <tr key={v.id}>
                      <td className="p-3 font-semibold text-luxe-label font-display">
                        {enquiries.find(e => e.id === v.enquiryId)?.clientName || 'Unknown'}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{new Date(v.scheduledAt).toLocaleDateString()}</td>
                      <td className="p-3 truncate max-w-[120px] text-slate-400" title={v.notes}>{v.notes || 'Routine Site Visit'}</td>
                      <td className="p-3 text-right font-display">
                        <span className="px-1.5 py-0.5 rounded bg-[#D4A65A]/10 text-[#8B7355] text-[10px] border border-[#D4A65A]/20">
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ReportsEngine;
