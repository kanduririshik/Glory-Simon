import React from 'react';
import CommunicationCenter from '../components/communication/CommunicationCenter';

export const CommunicationPage: React.FC = () => {
  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-48px)] overflow-hidden">
      <CommunicationCenter />
    </div>
  );
};

export default CommunicationPage;
