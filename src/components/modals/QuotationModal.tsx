import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Quotation, LineItem, QuotationStatus } from '@/types/entities';
import { PrimaryButton } from '@/components/ui/GlassCard';
import { formatINR } from '@/lib/supabase';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const STATUSES: QuotationStatus[] = ['Draft', 'Sent', 'Approved', 'Revised', 'Rejected'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Quotation>) => void;
  quotation?: Quotation | null;
}

function calcTotals(items: LineItem[], designFeePct: number, gstPct: number) {
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const designFee = subtotal * (designFeePct / 100);
  const gst = (subtotal + designFee) * (gstPct / 100);
  return { subtotal, grand_total: subtotal + designFee + gst };
}

export function QuotationModal({ open, onClose, onSave, quotation }: Props) {
  const { data: team = [] } = useTeamMembers();
  const [form, setForm] = useState<Partial<Quotation>>({ design_fee_pct: 12, gst_pct: 18, line_items: [] });

  useEffect(() => {
    if (quotation) setForm(quotation);
    else setForm({ status: 'Draft', design_fee_pct: 12, gst_pct: 18, line_items: [{ category: '', item_name: '', quantity: 1, rate: 0, total: 0 }] });
  }, [quotation, open]);

  const items = form.line_items || [];
  const { subtotal, grand_total } = useMemo(
    () => calcTotals(items, form.design_fee_pct || 12, form.gst_pct || 18),
    [items, form.design_fee_pct, form.gst_pct]
  );

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const next = [...items];
    const item = { ...next[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      item.total = Number(item.quantity) * Number(item.rate);
    }
    next[idx] = item;
    setForm(f => ({ ...f, line_items: next }));
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl glass-strong p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{quotation ? 'Edit Quotation' : 'New Quotation'}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client Name *" value={form.client_name || ''} onChange={v => setForm(f => ({ ...f, client_name: v }))} />
            <Field label="Project Name *" value={form.project_name || ''} onChange={v => setForm(f => ({ ...f, project_name: v }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="Status" value={form.status || 'Draft'} onChange={v => setForm(f => ({ ...f, status: v as QuotationStatus }))} options={STATUSES} />
            <Field label="Design Fee %" value={String(form.design_fee_pct ?? 12)} onChange={v => setForm(f => ({ ...f, design_fee_pct: Number(v) }))} type="number" />
            <Field label="GST %" value={String(form.gst_pct ?? 18)} onChange={v => setForm(f => ({ ...f, gst_pct: Number(v) }))} type="number" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Consultant</label>
            <select value={form.assigned_to || ''} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value || undefined }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Line Items</span>
              <button onClick={() => setForm(f => ({ ...f, line_items: [...items, { category: '', item_name: '', quantity: 1, rate: 0, total: 0 }] }))} className="flex items-center gap-1 text-xs text-primary cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <input placeholder="Category" value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)} className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs" />
                <input placeholder="Item" value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} className="col-span-3 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs" />
                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs" />
                <input type="number" placeholder="Rate" value={item.rate} onChange={e => updateItem(idx, 'rate', Number(e.target.value))} className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs" />
                <span className="col-span-2 text-xs text-right">{formatINR(item.total)}</span>
                <button onClick={() => setForm(f => ({ ...f, line_items: items.filter((_, i) => i !== idx) }))} className="col-span-1 p-1 text-rose-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="text-right space-y-1 text-sm border-t border-white/[0.06] pt-3">
            <div>Subtotal: {formatINR(subtotal)}</div>
            <div>Design Fee ({form.design_fee_pct}%): {formatINR(subtotal * ((form.design_fee_pct || 12) / 100))}</div>
            <div>GST ({form.gst_pct}%): {formatINR((subtotal + subtotal * ((form.design_fee_pct || 12) / 100)) * ((form.gst_pct || 18) / 100))}</div>
            <div className="text-primary font-semibold text-base">Grand Total: {formatINR(grand_total)}</div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
            <PrimaryButton disabled={!form.client_name?.trim() || !form.project_name?.trim()} onClick={() => onSave({ ...form, subtotal, grand_total })}>Save</PrimaryButton>
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
