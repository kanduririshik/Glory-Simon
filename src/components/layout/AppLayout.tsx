import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: 264 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="min-h-screen flex flex-col"
      >
        <div className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}

