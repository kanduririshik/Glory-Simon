import { jsPDF } from 'jspdf';
import type { Quotation } from '../types';

export const pdfService = {
  /**
   * Generates a beautifully styled, gold-themed Quotation PDF
   */
  generateQuotationPDF(
    quotation: Quotation,
    clientName: string,
    clientLocation: string,
    consultantName: string
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [212, 166, 90]; // #D4A65A (Gold)
    const textColor = [20, 20, 20]; // Dark Grey
    const secondaryTextColor = [100, 100, 100]; // Muted Grey
    
    // Page Width and height
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- HEADER ---
    doc.setFillColor(15, 15, 15); // Dark header bar
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(212, 166, 90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('GLORY SIMON INTERIORS', 15, 18);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('LUXURY ARCHITECTURAL SPACES', 15, 24);
    doc.text('Level 12, Manhattan Design Center, NY', 15, 29);
    
    doc.setTextColor(212, 166, 90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PROPOSAL', pageWidth - 15, 20, { align: 'right' });
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`No: ${quotation.quotationNumber}`, pageWidth - 15, 27, { align: 'right' });
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, pageWidth - 15, 33, { align: 'right' });

    // --- CLIENT & CONSULTANT METADATA ---
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PREPARED FOR:', 15, 55);
    doc.text('CONSULTANT:', 90, 55);
    doc.text('STATUS:', pageWidth - 15, 55, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, 15, 61);
    doc.text(consultantName || 'Unassigned', 90, 61);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text(clientLocation || 'New York, US', 15, 67);
    doc.text('Senior Design Associate', 90, 67);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(quotation.status.toUpperCase(), pageWidth - 15, 61, { align: 'right' });

    // Divider Line
    doc.setDrawColor(212, 166, 90);
    doc.setLineWidth(0.4);
    doc.line(15, 74, pageWidth - 15, 74);

    // --- SOURCING ITEMS TABLE ---
    let y = 82;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text('Line Specification Description', 15, y);
    doc.text('Qty', 115, y, { align: 'center' });
    doc.text('Unit Cost', 145, y, { align: 'right' });
    doc.text('Total', pageWidth - 15, y, { align: 'right' });

    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    quotation.items.forEach((item) => {
      // Handle page overflow if necessary
      if (y > 250) {
        doc.addPage();
        y = 25;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(item.description, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(item.quantity.toString(), 115, y, { align: 'center' });
      doc.text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 145, y, { align: 'right' });
      doc.text(`₹${item.amount.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });
      
      y += 8;
    });

    // Divider before Totals
    doc.line(15, y - 2, pageWidth - 15, y - 2);
    y += 5;

    // --- TOTALS ---
    const subtotal = Math.round(quotation.amount / 1.1);
    const tax = quotation.amount - subtotal;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text('Subtotal:', 140, y, { align: 'right' });
    doc.text(`₹${subtotal.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });
    
    y += 6;
    doc.text('Luxury Tax (10%):', 140, y, { align: 'right' });
    doc.text(`₹${tax.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Grand Total:', 140, y, { align: 'right' });
    doc.text(`₹${quotation.amount.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });

    // --- TERMS & CONDITIONS ---
    y = Math.max(y + 20, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('PROPOSAL CONDITIONS:', 15, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text('1. A 40% retainer payment is required to activate space modeling and material quarry locks.', 15, y + 4.5);
    doc.text('2. Sourcing quotes are valid for 30 calendar days from ledger dispatch date.', 15, y + 8.5);

    return doc;
  },

  /**
   * Generates a beautifully styled, gold-themed Invoice PDF
   */
  generateInvoicePDF(
    invoiceNumber: string,
    clientName: string,
    clientLocation: string,
    amount: number,
    items: { description: string; quantity: number; unitPrice: number; amount: number }[],
    consultantName: string,
    createdAt?: string
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [212, 166, 90]; // Gold
    const textColor = [20, 20, 20];
    const secondaryTextColor = [100, 100, 100];
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- HEADER ---
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(212, 166, 90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('GLORY SIMON INTERIORS', 15, 18);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('LUXURY ARCHITECTURAL SPACES', 15, 24);
    doc.text('Level 12, Manhattan Design Center, NY', 15, 29);
    
    doc.setTextColor(212, 166, 90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INVOICE', pageWidth - 15, 20, { align: 'right' });
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Invoice Ref: ${invoiceNumber}`, pageWidth - 15, 27, { align: 'right' });
    doc.text(`Date: ${new Date(createdAt || Date.now()).toLocaleDateString()}`, pageWidth - 15, 33, { align: 'right' });

    // --- CLIENT & METADATA ---
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILLED TO:', 15, 55);
    doc.text('ACCOUNT EXECUTIVE:', 90, 55);
    doc.text('PAYMENT STATUS:', pageWidth - 15, 55, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, 15, 61);
    doc.text(consultantName || 'Glory Simon', 90, 61);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text(clientLocation || 'New York, US', 15, 67);
    doc.text('Project Director', 90, 67);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34); // Forest Green
    doc.text('DUE ON RECEIPT', pageWidth - 15, 61, { align: 'right' });

    // Divider
    doc.setDrawColor(212, 166, 90);
    doc.setLineWidth(0.4);
    doc.line(15, 74, pageWidth - 15, 74);

    // --- INVOICE ITEMS ---
    let y = 82;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text('Invoice Line Specification', 15, y);
    doc.text('Qty', 115, y, { align: 'center' });
    doc.text('Unit Cost', 145, y, { align: 'right' });
    doc.text('Amount', pageWidth - 15, y, { align: 'right' });

    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    items.forEach((item) => {
      if (y > 250) {
        doc.addPage();
        y = 25;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(item.description, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(item.quantity.toString(), 115, y, { align: 'center' });
      doc.text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 145, y, { align: 'right' });
      doc.text(`₹${item.amount.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });
      y += 8;
    });

    doc.line(15, y - 2, pageWidth - 15, y - 2);
    y += 5;

    // --- TOTALS ---
    const subtotal = Math.round(amount / 1.1);
    const tax = amount - subtotal;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text('Subtotal:', 140, y, { align: 'right' });
    doc.text(`₹${subtotal.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });
    
    y += 6;
    doc.text('Luxury Tax (10%):', 140, y, { align: 'right' });
    doc.text(`₹${tax.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Total Amount Due:', 140, y, { align: 'right' });
    doc.text(`₹${amount.toLocaleString('en-IN')}`, pageWidth - 15, y, { align: 'right' });

    // --- FOOTER AND PAYMENT INSTRUCTIONS ---
    y = Math.max(y + 20, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('PAYMENT INSTRUCTIONS & TERMS:', 15, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text('1. Please quote Invoice Reference number in all bank wire transfers.', 15, y + 4.5);
    doc.text('2. Payments should be routed directly to Glory Simon Interiors Ltd Client Escrow Account.', 15, y + 8.5);

    return doc;
  },

  /**
   * Helper to trigger a direct download in-browser
   */
  download(doc: jsPDF, filename: string): void {
    doc.save(filename);
  },

  /**
   * Helper to open the PDF in a new browser tab for previewing
   */
  preview(doc: jsPDF): string {
    return doc.output('bloburl').toString();
  }
};

export default pdfService;
