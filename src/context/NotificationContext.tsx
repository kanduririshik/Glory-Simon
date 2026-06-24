import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/dataService';
import type { AppNotification } from '../types';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: AppNotification[];
  toasts: ToastMessage[];
  unreadCount: number;
  addToast: (title: string, message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('[NotificationContext] Failed to load notifications:', error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = api.subscribe(() => {
      loadNotifications();
    });
    return () => unsubscribe();
  }, []);

  const addToast = (title: string, message: string, type: ToastMessage['type']) => {
    const id = 'toast_' + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAsRead = async (id: string) => {
    await api.markNotificationAsRead(id);
    await loadNotifications();
  };

  const clearAll = async () => {
    await api.clearAllNotifications();
    await loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      toasts,
      unreadCount,
      addToast,
      removeToast,
      markAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
