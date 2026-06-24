import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Project, ProjectStatus } from '@/types/entities';
import { PrimaryButton } from '@/components/ui/GlassCard';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const STATUSES: ProjectStatus[] = ['Design Phase', 'In Progress', 'Procurement', 'Site Work', 'Completed', 'On Hold'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
  project?: Project | null;
}

export function ProjectModal({ open, onClose, onSave, project }: Props) {
  const { data: team = [] } = useTeamMembers();
  const [form, setForm] = useState<Partial<Project>>({ progress: 0, team_members: [], milestones: [] });

  useEffect(() => {
    if (project) setForm(project);
    else setForm({ status: 'Design Phase', progress: 0, team_members: [], milestones: [{ name: '', due_date: '', completed: false }] });
  }, [project, open]);

  const toggleMember = (id: string) => {
    const members = form.team_members || [];
    setForm(f => ({
      ...f,
      team_members: members.includes(id) ? members.filter(m => m !== id) : [...members, id],
    }));
  };

  const milestones = form.milestones || [];

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl glass-strong p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"><X className="h-5 w-5" /></button>
          </div>
          <Field label="Project Name *" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Field label="Client Name *" value={form.client_name || ''} onChange={v => setForm(f => ({ ...f, client_name: v }))} />
          <Field label="Location" value={form.location || ''} onChange={v => setForm(f => ({ ...f, location: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value (INR)" value={String(form.value ?? '')} onChange={v => setForm(f => ({ ...f, value: Number(v) || 0 }))} type="number" />
            <Field label="Progress %" value={String(form.progress ?? 0)} onChange={v => setForm(f => ({ ...f, progress: Math.min(100, Math.max(0, Number(v))) }))} type="number" />
          </div>
          <SelectField label="Status" value={form.status || 'Design Phase'} onChange={v => setForm(f => ({ ...f, status: v as ProjectStatus }))} options={STATUSES} />
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Team Members</label>
            <div className="flex flex-wrap gap-2">
              {team.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`px-3 py-1 rounded-full text-xs border cursor-pointer transition-colors ${
                    (form.team_members || []).includes(m.id)
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-white/[0.04] border-white/[0.08] text-muted-foreground'
                  }`}
                >
                  {m.full_name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Milestones</span>
              <button onClick={() => setForm(f => ({ ...f, milestones: [...milestones, { name: '', due_date: '', completed: false }] }))} className="flex items-center gap-1 text-xs text-primary cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
            {milestones.map((ms, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input placeholder="Name" value={ms.name} onChange={e => { const next = [...milestones]; next[idx] = { ...ms, name: e.target.value }; setForm(f => ({ ...f, milestones: next })); }} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs" />
                <input type="date" value={ms.due_date} onChange={e => { const next = [...milestones]; next[idx] = { ...ms, due_date: e.target.value }; setForm(f => ({ ...f, milestones: next })); }} className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs" />
                <button onClick={() => setForm(f => ({ ...f, milestones: milestones.filter((_, i) => i !== idx) }))} className="p-1 text-rose-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
            <PrimaryButton disabled={!form.name?.trim() || !form.client_name?.trim()} onClick={() => onSave(form)}>Save</PrimaryButton>
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
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
