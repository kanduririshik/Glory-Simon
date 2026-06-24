import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import EnquiryManagement from '../components/crm/EnquiryManagement';
import ClientDetail from '../components/client/ClientDetail';

export const EnquiriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedEnquiryId, setSelectedEnquiryId } = useCRM();

  if (selectedEnquiryId) {
    return (
      <ClientDetail
        onBack={() => setSelectedEnquiryId(null)}
        onNavigate={(tab) => {
          if (tab === 'crm' || tab === 'enquiries') {
            setSelectedEnquiryId(null);
            navigate('/enquiries');
          } else if (tab === 'studio' || tab === 'design-studio') {
            navigate('/design-studio');
          } else if (tab === 'ai-director') {
            navigate('/ai-director');
          } else if (tab === 'scheduler' || tab === 'site-visits') {
            navigate('/site-visits');
          } else if (tab === 'pipeline') {
            navigate('/pipeline');
          }
        }}
      />
    );
  }

  return (
    <EnquiryManagement
      onSelectEnquiry={(id) => setSelectedEnquiryId(id)}
      viewMode="list"
    />
  );
};

export default EnquiriesPage;

