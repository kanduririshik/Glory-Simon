import { createClient } from '@supabase/supabase-js';
import type { EnquiryStatus, PipelineStage } from '@/types/entities';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STATUS_COLORS: Record<string, string> = {
  Hot: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  Warm: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  New: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Cold: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Converted: 'bg-primary/15 text-primary border-primary/20',
  Lost: 'bg-muted text-muted-foreground border-white/[0.06]',
  Scheduled: 'bg-blue-500/15 text-blue-400',
  Completed: 'bg-emerald-500/15 text-emerald-400',
  Cancelled: 'bg-rose-500/15 text-rose-400',
  Rescheduled: 'bg-amber-500/15 text-amber-400',
  Draft: 'bg-muted text-muted-foreground',
  Sent: 'bg-blue-500/15 text-blue-400',
  Approved: 'bg-emerald-500/15 text-emerald-400',
  Revised: 'bg-amber-500/15 text-amber-400',
  Rejected: 'bg-rose-500/15 text-rose-400',
};

export const PIPELINE_STAGES: PipelineStage[] = [
  'New Enquiry', 'Consultation', 'Design Proposal', 'Negotiation', 'Won', 'Lost',
];

export const PIPELINE_COLORS: Record<PipelineStage, string> = {
  'New Enquiry': 'bg-blue-400',
  'Consultation': 'bg-amber-400',
  'Design Proposal': 'bg-purple-400',
  'Negotiation': 'bg-primary',
  'Won': 'bg-emerald-400',
  'Lost': 'bg-muted-foreground',
};

export const ENQUIRY_STATUSES: EnquiryStatus[] = ['New', 'Hot', 'Warm', 'Cold', 'Converted', 'Lost'];

export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatBudget(min?: number, max?: number): string {
  if (!min && !max) return '—';
  if (min && max) return `₹${min}–${max}L`;
  if (min) return `₹${min}L+`;
  return `Up to ₹${max}L`;
}

export function getInitials(name: string): string {
  return name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function statusBadgeClass(status: string): string {
  return STATUS_COLORS[status] || 'bg-muted text-muted-foreground border-white/[0.06]';
}
