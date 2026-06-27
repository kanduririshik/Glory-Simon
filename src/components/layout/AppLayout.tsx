import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = isMobile ? 0 : 72;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex overflow-hidden">
      {/* Mobile Backdrop for Sidebar */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setCollapsed(true)}
        />
      )}

      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        isMobile={isMobile}
      />

      <motion.main
        initial={false}
        animate={{ 
          marginLeft: sidebarWidth,
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`
        }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="min-h-screen flex flex-col flex-grow w-full overflow-y-auto"
      >
        {/* Mobile Header Toolbar */}
        {isMobile && (
          <div className="h-14 border-b border-[#D4A65A]/15 bg-[#111111] px-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-black text-xs shrink-0"
                style={{ background: 'linear-gradient(135deg, #D4A65A 0%, #E6C27A 100%)', boxShadow: '0 0 10px rgba(212,166,90,0.3)' }}
              >
                GS
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-[#F5F1EA] font-serif tracking-wide block">Glory Simon</span>
                <span className="text-[8px] text-[#CBBEAB] uppercase tracking-wider block font-light leading-none">Interiors CRM</span>
              </div>
            </div>
            
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg bg-[#050505] border border-[#D4A65A]/25 text-[#D4A65A] cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-4 md:p-6 flex-1 w-full max-w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}

