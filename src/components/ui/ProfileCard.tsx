import React from 'react';
import { motion } from 'framer-motion';
import { Award, Briefcase, Compass, Shield, Flame, Star, CheckSquare } from 'lucide-react';
import type { UserProfile, UserRole } from '../../types';

interface ProfileCardProps {
  profile: UserProfile | null | undefined;
  className?: string;
  variant?: 'default' | 'flat' | 'glow';
}

export const ROLE_BADGE_CONFIG: Record<UserRole, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  'Admin': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    icon: <Shield className="h-3 w-3" />
  },
  'Project Manager': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: <Briefcase className="h-3 w-3" />
  },
  'Interior Designer': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    icon: <Compass className="h-3 w-3" />
  },
  'Site Engineer': {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
    icon: <Award className="h-3 w-3" />
  },
  'Client Relationship Manager': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    icon: <Star className="h-3 w-3" />
  },
  'Procurement Coordinator': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    icon: <Flame className="h-3 w-3" />
  },
  'Vendor Manager': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    icon: <Award className="h-3 w-3" />
  }
};

export const ROLE_RESPONSIBILITIES: Record<UserRole, string[]> = {
  'Project Manager': [
    'Client Coordination',
    'Project Planning',
    'Team Supervision'
  ],
  'Interior Designer': [
    'Space Design',
    'Material Selection',
    'Visual Concepts'
  ],
  'Site Engineer': [
    'Site Execution',
    'Quality Checks',
    'Contractor Coordination'
  ],
  'Client Relationship Manager': [
    'Client Communication',
    'Meeting Scheduling',
    'Follow Ups'
  ],
  'Procurement Coordinator': [
    'Vendor Management',
    'Procurement Tracking',
    'Cost Optimization'
  ],
  'Vendor Manager': [
    'Supplier Relations',
    'Delivery Coordination',
    'Contract Management'
  ],
  'Admin': [
    'Platform Oversight',
    'Resource Allocation',
    'Executive Decisions'
  ]
};

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  className = '', 
  variant = 'default' 
}) => {
  if (!profile) {
    return (
      <div className={`p-6 rounded-2xl border border-dashed border-[#D4A65A]/20 bg-[#141414]/30 text-slate-500 text-center text-xs italic ${className}`}>
        No active assignee details loaded.
      </div>
    );
  }

  // Fallback values if missing in live database
  const roleTitle = profile.roleTitle || profile.role;
  const specialization = profile.specialization || 'Luxury Interior Sourcing';
  const yearsExperience = profile.yearsExperience || 5;
  const projectsCompleted = profile.projectsCompleted || 24;
  const bio = profile.bio || `Specialized luxury coordination consultant serving Glory Simon's elite clientele.`;
  const image = profile.profileImage || profile.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60';
  
  const badge = ROLE_BADGE_CONFIG[profile.role] || ROLE_BADGE_CONFIG['Admin'];
  const responsibilities = ROLE_RESPONSIBILITIES[profile.role] || ROLE_RESPONSIBILITIES['Admin'];

  const cardBgClass = variant === 'glow'
    ? 'glass-premium-gold shadow-floating-luxe'
    : 'glass-premium-light shadow-soft-luxe';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, borderColor: 'rgba(212, 166, 90, 0.35)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative p-5 rounded-2xl border border-[#D4A65A]/12 bg-[#1A1A1E]/80 backdrop-blur-md overflow-hidden flex flex-col gap-4 text-left ${cardBgClass} ${className}`}
    >
      {/* Decorative Gold Radial Light */}
      <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-[#D4A65A]/4 rounded-full filter blur-2xl pointer-events-none" />
      
      {/* Top Section: Avatar & Badges */}
      <div className="flex gap-4 items-start">
        <div className="relative flex-shrink-0">
          <img 
            src={image} 
            alt={profile.fullName} 
            className="w-16 h-16 rounded-xl object-cover border border-[#D4A65A]/30 shadow-md"
          />
          <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none" />
        </div>
        
        <div className="space-y-1.5 flex-grow">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-serif font-semibold text-white tracking-wide">{profile.fullName}</h4>
            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${badge.border} ${badge.bg} ${badge.text} text-[8px] font-bold uppercase tracking-wider font-mono`}>
              {badge.icon}
              {profile.role}
            </span>
          </div>
          <p className="text-[11px] text-[#D4A65A] font-semibold tracking-wide">{roleTitle}</p>
          <p className="text-[10px] text-white/50 font-light italic leading-tight">{specialization}</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 bg-black/30 rounded-xl p-3 border border-white/5 font-mono text-[9px] uppercase tracking-wider text-white/40">
        <div>
          <span className="block text-[8px]">Experience</span>
          <strong className="block text-xs font-semibold text-[#E6C27A] mt-0.5">{yearsExperience} Years</strong>
        </div>
        <div>
          <span className="block text-[8px]">Projects</span>
          <strong className="block text-xs font-semibold text-[#E6C27A] mt-0.5">{projectsCompleted} Completed</strong>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <span className="text-[8px] text-[#8B7355] font-mono uppercase tracking-widest font-semibold block">Biography</span>
        <p className="text-[10px] text-white/70 font-light leading-relaxed line-clamp-3">
          {bio}
        </p>
      </div>

      {/* Responsibilities */}
      <div className="space-y-2 border-t border-white/5 pt-3">
        <span className="text-[8px] text-[#8B7355] font-mono uppercase tracking-widest font-semibold block">Key Responsibilities</span>
        <ul className="grid grid-cols-1 gap-1.5">
          {responsibilities.map((resp, idx) => (
            <li key={idx} className="flex items-center gap-2 text-[10px] text-white/70 font-light">
              <CheckSquare className="h-3 w-3 text-[#D4A65A]/80 flex-shrink-0" />
              <span>{resp}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
