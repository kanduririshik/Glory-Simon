import React from 'react';
import QuotationManager from '../components/quotation/QuotationManager';

export const QuotationsPage: React.FC = () => {
  return (
    <div className="p-6 md:p-8">
      <QuotationManager />
    </div>
  );
};

export default QuotationsPage;
