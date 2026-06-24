import React from 'react';
import EnquiryManagement from '../components/crm/EnquiryManagement';

export const PipelinePage: React.FC<{ 
  onSelectEnquiry: (id: string) => void;
}> = ({ onSelectEnquiry }) => {
  return (
    <div className="h-full w-full">
      <EnquiryManagement onSelectEnquiry={onSelectEnquiry} viewMode="kanban" />
    </div>
  );
};

export default PipelinePage;
