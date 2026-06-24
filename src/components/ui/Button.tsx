import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'gold' | 'glass' | 'ghost' | 'danger' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  className = '',
  isLoading = false,
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  // Magnetic coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Pull intensity
    const pullX = (clientX - centerX) * 0.35;
    const pullY = (clientY - centerY) * 0.35;

    x.set(pullX);
    y.set(pullY);
    setHovered(true);

    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    x.set(0);
    y.set(0);
    setHovered(false);

    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
      case 'premium':
        return 'bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-[#050505] font-semibold border border-[#E6C27A]/20 shadow-[0_8px_30px_rgba(212,166,90,0.15)] relative overflow-hidden';
      case 'glass':
        return 'bg-[#0A0A0A]/60 backdrop-blur-md border border-[#D4A65A]/35 text-[#D4A65A] font-semibold hover:bg-[#0A0A0A]/90 hover:shadow-[0_8px_30px_rgba(212,166,90,0.2)] shadow-sm';
      case 'ghost':
        return 'text-[#D4A65A] hover:bg-[#D4A65A]/10 border border-transparent';
      case 'danger':
        return 'bg-rose-500/10 border border-rose-500/35 text-rose-400 hover:bg-rose-500/20';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs rounded-[14px]';
      case 'lg':
        return 'px-6 py-3 text-base rounded-[14px]';
      default:
        return 'px-4.5 py-2 text-sm rounded-[14px]';
    }
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.02 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-flex items-center justify-center font-display tracking-wide focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {/* Liquid Hover background overlay */}
      {hovered && (variant === 'gold' || variant === 'premium') && (
        <motion.span 
          layoutId="liquidBg"
          className="absolute inset-0 bg-white/5 rounded-lg pointer-events-none filter blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        <motion.span
          animate={{ x: hovered ? x.get() * 0.15 : 0, y: hovered ? y.get() * 0.15 : 0 }}
          className="flex items-center gap-1.5"
        >
          {children}
        </motion.span>
      )}
    </motion.button>
  );
};

export default Button;
