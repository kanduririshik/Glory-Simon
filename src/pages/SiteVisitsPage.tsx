import React from 'react';
import SiteVisitScheduler from '../components/site-visit/SiteVisitScheduler';

export const SiteVisitsPage: React.FC = () => {
  return (
    <div className="p-6 md:p-8">
      <SiteVisitScheduler />
    </div>
  );
};

export default SiteVisitsPage;
