import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Enquiry, ProjectType, LeadSource, EnquiryStatus, PipelineStage } from '@/types/entities';
import { PrimaryButton } from '@/components/ui/GlassCard';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const PROJECT_TYPES: ProjectType[] = ['Villa', 'Penthouse', 'Apartment', 'Duplex', 'Office', 'Commercial', 'Retail', 'Farmhouse'];
const SOURCES: LeadSource[] = ['Referral', 'Instagram', 'Website', 'Walk-in', 'LinkedIn', 'Other'];
const STATUSES: EnquiryStatus[] = ['New', 'Hot', 'Warm', 'Cold', 'Converted', 'Lost'];
const STAGES: PipelineStage[] = ['New Enquiry', 'Consultation', 'Design Proposal', 'Negotiation', 'Won', 'Lost'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Enquiry>) => void;
  enquiry?: Enquiry | null;
}

export function EnquiryModal({ open, onClose, onSave, enquiry }: Props) {
  const { data: team = [] } = useTeamMembers();
  const [form, setForm] = useState<Partial<Enquiry>>({});

  useEffect(() => {
    if (enquiry) setForm(enquiry);
    else setForm({ status: 'New', pipeline_stage: 'New Enquiry' });
  }, [enquiry, open]);

  const set = (k: keyof Enquiry, v: unknown) => setForm(f => ({ ...f, [k]: v }));

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
            <h2 className="text-lg font-semibold">{enquiry ? 'Edit Enquiry' : 'New Enquiry'}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"><X className="h-5 w-5" /></button>
          </div>
          <Field label="Client Name *" value={form.client_name || ''} onChange={v => set('client_name', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
            <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} />
          </div>
          <Field label="Location" value={form.location || ''} onChange={v => set('location', v)} />
          <SelectField label="Project Type" value={form.project_type || ''} onChange={v => set('project_type', v)} options={PROJECT_TYPES} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget Min (L)" value={String(form.budget_min ?? '')} onChange={v => set('budget_min', v ? Number(v) : undefined)} type="number" />
            <Field label="Budget Max (L)" value={String(form.budget_max ?? '')} onChange={v => set('budget_max', v ? Number(v) : undefined)} type="number" />
          </div>
          <SelectField label="Source" value={form.source || ''} onChange={v => set('source', v)} options={SOURCES} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Status" value={form.status || 'New'} onChange={v => set('status', v)} options={STATUSES} />
            <SelectField label="Pipeline Stage" value={form.pipeline_stage || 'New Enquiry'} onChange={v => set('pipeline_stage', v)} options={STAGES} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Assigned To</label>
            <select value={form.assigned_to || ''} onChange={e => set('assigned_to', e.target.value || undefined)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40">
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
            <PrimaryButton disabled={!form.client_name?.trim()} onClick={() => onSave(form)}>Save</PrimaryButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={value} required={required} onChange={e => onChange(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40" />
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
