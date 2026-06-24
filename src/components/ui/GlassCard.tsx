import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: 'blue' | 'purple' | 'pink' | 'green';
  style?: CSSProperties;
  onClick?: () => void;
}

const glowMap = {
  blue: 'shadow-[0_0_30px_-8px_rgba(212,166,90,0.4)]',
  purple: 'shadow-[0_0_30px_-8px_rgba(230,194,122,0.4)]',
  pink: 'shadow-[0_0_30px_-8px_rgba(199,178,153,0.3)]',
  green: 'shadow-[0_0_30px_-8px_rgba(155,207,138,0.3)]',
};

export function GlassCard({ children, className = '', delay = 0, hover = false, glow, style, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={hover ? { y: -4, borderColor: 'rgba(230, 194, 122, 0.50)', boxShadow: '0 15px 60px rgba(212,166,90,0.15)', transition: { duration: 0.3, ease: 'easeOut' } } : undefined}
      className={`relative rounded-2xl overflow-hidden ${glow ? glowMap[glow] : ''} ${className}`}
      style={{
        background: 'rgba(17,17,17,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(212,166,90,0.20)',
        boxShadow: '0 10px 40px rgba(212,166,90,0.08)',
        ...style,
      }}
      onClick={onClick}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4A65A]/20 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Hot: 'bg-[#D66A6A]/10 text-[#D66A6A] border-[#D66A6A]/20',
    Warm: 'bg-[#D99A6C]/10 text-[#D99A6C] border-[#D99A6C]/20',
    New: 'bg-[#9BCF8A]/10 text-[#9BCF8A] border-[#9BCF8A]/20',
    Cold: 'bg-[#D4A65A]/10 text-[#D4A65A] border-[#D4A65A]/20',
    Converted: 'bg-[#D4A65A]/20 text-[#D4A65A] border-[#D4A65A]/30',
    Lost: 'bg-white/[0.02] text-[#8B7355] border-white/[0.05]',
    Scheduled: 'bg-[#D4A65A]/10 text-[#D4A65A] border-[#D4A65A]/20',
    Completed: 'bg-[#9BCF8A]/10 text-[#9BCF8A] border-[#9BCF8A]/20',
    Cancelled: 'bg-[#D66A6A]/10 text-[#D66A6A] border-[#D66A6A]/20',
    Rescheduled: 'bg-[#D99A6C]/10 text-[#D99A6C] border-[#D99A6C]/20',
    Draft: 'bg-white/[0.02] text-[#8B7355] border-white/[0.05]',
    Sent: 'bg-[#D4A65A]/10 text-[#D4A65A] border-[#D4A65A]/20',
    Approved: 'bg-[#9BCF8A]/10 text-[#9BCF8A] border-[#9BCF8A]/20',
    Revised: 'bg-[#D99A6C]/10 text-[#D99A6C] border-[#D99A6C]/20',
    Rejected: 'bg-[#D66A6A]/10 text-[#D66A6A] border-[#D66A6A]/20',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium border ${colors[status] || colors.Draft}`}>
      {status}
    </span>
  );
}

export function AvatarInitials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' }[size];
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-[#050505] shrink-0`}
      style={{ background: 'linear-gradient(135deg, #D4A65A 0%, #E6C27A 100%)', boxShadow: '0 0 12px rgba(212,166,90,0.3)' }}
    >
      {initials}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#F5F1EA] tracking-wide">{title}</h1>
        {subtitle && <p className="text-sm text-[#CBBEAB] mt-1 font-sans">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = '' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-[14px] bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-[#050505] text-sm font-semibold hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_30px_rgba(212,166,90,0.25)] transition-all duration-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function SelectInput({ value, onChange, options, className = '' }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`bg-[#0A0A0A] border border-[#D4A65A]/25 rounded-[14px] px-3 py-1.5 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#D4A65A] focus:ring-1 focus:ring-[#D4A65A] cursor-pointer ${className}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} className="bg-[#0A0A0A] text-[#F5F1EA]">{o.label}</option>
      ))}
    </select>
  );
}
