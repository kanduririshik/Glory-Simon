import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Kanban, Calendar, FileText, Palette,
  Sparkles, MessageSquare, FolderKanban, BarChart3, Settings, ChevronLeft,
  Contact, LogOut
} from 'lucide-react';
import { useCRM } from '@/context/CRMContext';
import { useAuth } from '@/lib/AuthContext';

const ROLE_NAV_MAP: Record<string, string[]> = {
  'Admin': ['/', '/clients', '/enquiries', '/pipeline', '/site-visits', '/quotations', '/design-studio', '/ai-director', '/messages', '/projects', '/reports', '/settings'],
  'Design Consultant': ['/', '/enquiries', '/pipeline', '/quotations', '/messages', '/settings'],
  'Interior Designer': ['/', '/design-studio', '/ai-director', '/projects', '/messages', '/settings'],
  'Site Engineer': ['/', '/site-visits', '/projects', '/messages', '/settings'],
  'Project Manager': ['/', '/projects', '/pipeline', '/messages', '/settings'],
  'Vendor Manager': ['/', '/projects', '/messages', '/settings'],
  'Procurement Coordinator': ['/', '/projects', '/messages', '/settings'],
  'Client Relationship Manager': ['/', '/enquiries', '/messages', '/settings'],
  'Accounts Manager': ['/', '/quotations', '/reports', '/settings'],
  'CRM Executive': ['/', '/enquiries', '/settings'],
  'Sales Executive': ['/', '/enquiries', '/pipeline', '/settings'],
  'Operations Manager': ['/', '/reports', '/settings']
};

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#D4A65A' },
  { path: '/clients', label: 'Clients', icon: Contact, color: '#D4A65A' },
  { path: '/enquiries', label: 'Enquiries', icon: Users, color: '#D4A65A' },
  { path: '/pipeline', label: 'Pipeline', icon: Kanban, color: '#D4A65A' },
  { path: '/site-visits', label: 'Site Visits', icon: Calendar, color: '#D4A65A' },
  { path: '/quotations', label: 'Quotations', icon: FileText, color: '#D4A65A' },
  { path: '/design-studio', label: 'Design Studio', icon: Palette, color: '#D4A65A' },
  { path: '/ai-director', label: 'AI Director', icon: Sparkles, color: '#D4A65A' },
  { path: '/messages', label: 'Messages', icon: MessageSquare, color: '#D4A65A' },
  { path: '/projects', label: 'Projects', icon: FolderKanban, color: '#D4A65A' },
  { path: '/reports', label: 'Reports', icon: BarChart3, color: '#D4A65A' },
  { path: '/settings', label: 'Settings', icon: Settings, color: '#D4A65A' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ collapsed: propCollapsed, onToggle, isMobile }: SidebarProps) {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = propCollapsed !== undefined ? propCollapsed : localCollapsed;
  
  const location = useLocation();
  const { currentUser } = useCRM();
  const { logout } = useAuth();

  const currentRole = currentUser?.role || 'Admin';
  const allowedPaths = ROLE_NAV_MAP[currentRole] || ROLE_NAV_MAP['Admin'];
  const filteredNavItems = NAV_ITEMS.filter(item => allowedPaths.includes(item.path));

  const width = isMobile ? 264 : (collapsed ? 72 : 264);
  const x = isMobile && collapsed ? -264 : 0;

  return (
    <motion.aside
      animate={{ width, x }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-[#D4A65A]/15 bg-[#0A0A0A] shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
    >
      <div className="p-4 flex items-center gap-3 overflow-hidden">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 min-w-0"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-black text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #D4A65A 0%, #E6C27A 100%)', boxShadow: '0 0 20px rgba(212,166,90,0.4)' }}
              >
                GS
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#F5F1EA] truncate font-serif tracking-wide">Glory Simon</div>
                <div className="text-[10px] text-[#CBBEAB] uppercase tracking-wider font-light">Interiors CRM</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25 }}
              className="mx-auto"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-black text-sm"
                style={{ background: 'linear-gradient(135deg, #D4A65A 0%, #E6C27A 100%)', boxShadow: '0 0 20px rgba(212,166,90,0.4)' }}
              >
                GS
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item, i) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.03, duration: 0.4 }}
            >
              <Link to={item.path}>
                <motion.div
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors border ${
                    isActive 
                      ? 'text-[#F5F1EA] bg-[#D4A65A]/10 border-[#D4A65A]/25' 
                      : 'text-[#CBBEAB] hover:text-[#F5F1EA] hover:bg-[#D4A65A]/5 border-transparent'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                      style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}` }}
                    />
                  )}
                  <Icon className="h-5 w-5 shrink-0" style={{ color: isActive ? item.color : undefined }} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#D4A65A]/10 space-y-2">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="px-2 py-1.5 flex items-center justify-start gap-2.5 text-xs text-[#CBBEAB] min-w-0">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
              <span className="truncate font-sans font-medium text-[#F5F1EA]">
                {currentUser ? `${currentUser.fullName}` : 'Glory Simon'} (Admin)
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[#CBBEAB] hover:text-rose-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => logout()}
              className="p-2 rounded-xl hover:bg-rose-500/10 text-[#CBBEAB] hover:text-rose-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => onToggle ? onToggle() : setLocalCollapsed(c => !c)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.04] text-[#CBBEAB] hover:text-[#F5F1EA] transition-colors cursor-pointer"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.35 }}>
              <ChevronLeft className="h-5 w-5" />
            </motion.div>
          </button>
        )}
      </div>
    </motion.aside>
  );
}

export function useSidebarWidth() {
  return 264;
}
