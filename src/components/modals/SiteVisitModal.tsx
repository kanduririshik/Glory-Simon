import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { SiteVisit, VisitType, VisitStatus } from '@/types/entities';
import { PrimaryButton } from '@/components/ui/GlassCard';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const VISIT_TYPES: VisitType[] = ['Initial Survey', 'Progress Review', 'Final Walkthrough', 'Design Presentation', 'Material Selection'];
const STATUSES: VisitStatus[] = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<SiteVisit>) => void;
  visit?: SiteVisit | null;
}

export function SiteVisitModal({ open, onClose, onSave, visit }: Props) {
  const { data: team = [] } = useTeamMembers();
  const [form, setForm] = useState<Partial<SiteVisit>>({});

  useEffect(() => {
    if (visit) setForm(visit);
    else setForm({ visit_time: '10:00 AM', status: 'Scheduled', visit_date: new Date().toISOString().split('T')[0] });
  }, [visit, open]);

  const set = (k: keyof SiteVisit, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl glass-strong p-6 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{visit ? 'Edit Visit' : 'Schedule Visit'}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"><X className="h-5 w-5" /></button>
          </div>
          <Field label="Client Name *" value={form.client_name || ''} onChange={v => set('client_name', v)} />
          <Field label="Location" value={form.location || ''} onChange={v => set('location', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Visit Date *" value={form.visit_date || ''} onChange={v => set('visit_date', v)} type="date" />
            <Field label="Visit Time" value={form.visit_time || '10:00 AM'} onChange={v => set('visit_time', v)} />
          </div>
          <SelectField label="Visit Type" value={form.visit_type || ''} onChange={v => set('visit_type', v as VisitType)} options={VISIT_TYPES} />
          <SelectField label="Status" value={form.status || 'Scheduled'} onChange={v => set('status', v as VisitStatus)} options={STATUSES} />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Engineer</label>
            <select value={form.engineer_id || ''} onChange={e => set('engineer_id', e.target.value || undefined)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40">
              <option value="">Unassigned</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes</label>
            <textarea rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
            <PrimaryButton disabled={!form.client_name?.trim() || !form.visit_date} onClick={() => onSave(form)}>Save</PrimaryButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40">
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
