import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAI } from '../../context/AIContext';

interface AIOrbProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  size = 'md',
  showLabel = false
}) => {
  const { orbState } = useAI();

  const getDimensions = () => {
    switch (size) {
      case 'sm': return { width: 'w-12', height: 'h-12', icon: 16 };
      case 'lg': return { width: 'w-28', height: 'h-28', icon: 32 };
      default: return { width: 'w-16', height: 'h-16', icon: 20 };
    }
  };

  const dims = getDimensions();

  // Color combinations mapping to different states
  const getOrbGradient = () => {
    switch (orbState) {
      case 'thinking':
        return 'from-[#D4A65A] via-[#F6E7C1] to-[#C76B4F]';
      case 'streaming':
        return 'from-[#D4A65A] via-[#D99A6C] to-[#8B7355]';
      case 'completed':
        return 'from-[#D4A65A] via-[#FFF8F0] to-[#FFFFFF]';
      default:
        return 'from-[#8B7355] via-[#D4A65A] to-[#F6E7C1]';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center font-display">
      <div className="relative flex items-center justify-center">
        {/* Layer 1: Ambient mesh light blur */}
        <motion.div
          animate={{
            scale: orbState === 'thinking' ? [1.1, 1.4, 1.1] : [1, 1.2, 1],
            opacity: orbState === 'thinking' ? [0.4, 0.7, 0.4] : [0.25, 0.45, 0.25],
            rotate: 360
          }}
          transition={{
            repeat: Infinity,
            duration: orbState === 'thinking' ? 2 : 6,
            ease: "easeInOut"
          }}
          className={`absolute rounded-full bg-gradient-to-tr ${getOrbGradient()} filter blur-2xl z-0 ${dims.width} ${dims.height}`}
        />

        {/* Layer 2: Rotating border highlight */}
        <motion.div
          animate={{
            rotate: 360,
            scale: orbState === 'streaming' ? [1.05, 1.15, 1.05] : 1
          }}
          transition={{
            repeat: Infinity,
            duration: orbState === 'thinking' ? 1.5 : 8,
            ease: "linear"
          }}
          className={`absolute rounded-full p-[1px] bg-gradient-to-r ${getOrbGradient()} z-0 ${dims.width} ${dims.height} opacity-85`}
        />

        {/* Layer 3: Glass core lens */}
        <div className={`relative z-10 flex items-center justify-center bg-white/80 border border-[#D4A65A]/25 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_10px_25px_rgba(139,115,85,0.12)] ${dims.width} ${dims.height} overflow-hidden group`}>
          {/* Internal rotating light reflection */}
          <motion.div
            animate={{
              x: ['-100%', '100%'],
              y: ['-100%', '100%']
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#D4A65A]/10 to-transparent pointer-events-none"
          />

          <Sparkles 
            size={dims.icon} 
            className={`transition-all duration-700 ${
              orbState === 'thinking' 
                ? 'text-[#D4A65A] animate-pulse drop-shadow-[0_0_10px_rgba(212,166,90,0.6)]' 
                : orbState === 'streaming' 
                  ? 'text-[#8B7355] drop-shadow-[0_0_8px_rgba(139,115,85,0.5)]' 
                  : orbState === 'completed'
                    ? 'text-[#D4A65A] scale-110 drop-shadow-[0_0_12px_rgba(212,166,90,0.7)]'
                    : 'text-[#8B7355]/80 group-hover:text-[#D4A65A] transition-colors'
            }`} 
          />
        </div>
      </div>

      {showLabel && (
        <span className="text-xxs font-display tracking-widest text-[#8B7355] mt-3 uppercase font-semibold">
          {orbState === 'thinking' ? 'AI is composing...' : 
           orbState === 'streaming' ? 'Streaming summary' : 
           orbState === 'completed' ? 'Compose complete' : 
           'AI Design Director'}
        </span>
      )}
    </div>
  );
};

export default AIOrb;
