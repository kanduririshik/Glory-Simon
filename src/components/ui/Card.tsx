import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'flat' | 'spotlight';
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  hoverEffect = true,
  onMouseMove,
  ...props 
}) => {
  const getVariantClasses = () => {
    return 'bg-[#111111] border border-[#D4A65A]/20 rounded-2xl shadow-[0_10px_40px_rgba(212,166,90,0.08)]';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    currentTarget.style.setProperty('--mouse-x', `${x}px`);
    currentTarget.style.setProperty('--mouse-y', `${y}px`);
    
    // Call parent handler if it exists
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const hoverAnimation: any = hoverEffect 
    ? {
        whileHover: { 
          y: -4,
          borderColor: 'rgba(230, 194, 122, 0.50)',
          boxShadow: '0 15px 60px rgba(212,166,90,0.15)',
        },
        transition: { duration: 0.3, ease: 'easeOut' }
      }
    : {};

  return (
    <motion.div
      className={`${getVariantClasses()} ${className}`}
      onMouseMove={handleMouseMove}
      {...hoverAnimation}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
