import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UserProfile } from '../../types';

interface TeamSelectorProps {
  profiles: UserProfile[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  profiles,
  selectedId,
  onChange,
  placeholder = 'Select Team Member...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProfile = profiles.find(p => p.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative text-left ${className}`}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(p => !p)}
        className="w-full flex items-center justify-between pl-4 pr-10 py-3 bg-[#1C1C1E]/60 border border-[#D4A65A]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all cursor-pointer shadow-inner min-h-[48px]"
      >
        {selectedProfile ? (
          <div className="flex items-center gap-2.5">
            <img
              src={selectedProfile.profileImage || selectedProfile.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60'}
              alt={selectedProfile.fullName}
              className="w-6 h-6 rounded-lg object-cover border border-[#D4A65A]/35"
            />
            <div className="text-left leading-normal">
              <span className="font-semibold text-white block">{selectedProfile.fullName}</span>
              <span className="text-[9px] text-[#D4A65A] font-mono block uppercase">{selectedProfile.roleTitle || selectedProfile.role}</span>
            </div>
          </div>
        ) : (
          <span className="text-white/40 font-light">{placeholder}</span>
        )}
        <ChevronDown className={`absolute right-3.5 top-4 h-4 w-4 text-[#D4A65A]/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-[999] glass-premium-gold border-[#D4A65A]/35 rounded-2xl shadow-floating-luxe p-2 max-h-72 overflow-y-auto backdrop-blur-2xl">
          {profiles.length === 0 ? (
            <div className="py-4 text-center text-xs text-white/40 italic">No team members loaded.</div>
          ) : (
            profiles.map(p => {
              const isSelected = p.id === selectedId;
              const roleTitle = p.roleTitle || p.role;
              const specialization = p.specialization || 'Luxury Interior Sourcing';
              const yearsExperience = p.yearsExperience || 5;
              const projectsCompleted = p.projectsCompleted || 24;
              const image = p.profileImage || p.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60';

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left border cursor-pointer mt-1 ${
                    isSelected 
                      ? 'bg-[#D4A65A]/10 border-[#D4A65A]/30 shadow-sm' 
                      : 'bg-transparent border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={p.fullName}
                    className="w-10 h-10 rounded-xl object-cover border border-[#D4A65A]/20"
                  />
                  <div className="flex-grow space-y-0.5 leading-normal">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-semibold text-xs text-white block">{p.fullName}</span>
                      <span className="text-[7.5px] font-mono text-[#D4A65A] font-bold block uppercase bg-[#D4A65A]/10 border border-[#D4A65A]/20 px-1 rounded">
                        {p.role}
                      </span>
                    </div>
                    <span className="text-[9.5px] text-[#E6C27A] font-medium block">{roleTitle}</span>
                    <span className="text-[9px] text-white/50 block font-light leading-tight">{specialization}</span>
                    <div className="flex gap-3 text-[8px] font-mono text-white/40 pt-1">
                      <span>{yearsExperience} Years Exp</span>
                      <span>•</span>
                      <span>{projectsCompleted} Projects Completed</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default TeamSelector;
