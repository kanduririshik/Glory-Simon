import { useState, useEffect } from 'react';

const FILTER_KEY = 'gsi_selected_staff_id';

export const getGlobalTeamFilter = (): string => {
  return localStorage.getItem(FILTER_KEY) || 'All';
};

export const setGlobalTeamFilter = (filter: string) => {
  if (filter && filter !== 'All') {
    localStorage.setItem(FILTER_KEY, filter);
  } else {
    localStorage.removeItem(FILTER_KEY);
  }
  window.dispatchEvent(new Event('crm_global_filter_changed'));
};

export const useGlobalTeamFilter = () => {
  const [filter, setFilter] = useState(getGlobalTeamFilter());
  
  useEffect(() => {
    const handleChanged = () => {
      setFilter(getGlobalTeamFilter());
    };
    window.addEventListener('crm_global_filter_changed', handleChanged);
    return () => window.removeEventListener('crm_global_filter_changed', handleChanged);
  }, []);
  
  return [filter, setGlobalTeamFilter] as const;
};

export const useSimulatedPortalRole = () => {
  return ['Admin', (_role: string) => {}] as const;
};
