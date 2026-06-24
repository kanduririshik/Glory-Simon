// Real Export Service Implementation
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export interface IExportService {
  exportToPDF(filename: string, data: any[]): Promise<boolean>;
  exportToCSV(filename: string, data: any[]): Promise<boolean>;
  exportToExcel(filename: string, data: any[]): Promise<boolean>;
}

class RealExportService implements IExportService {
  // Helper to trigger a download
  private triggerDownload(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async exportToCSV(filename: string, data: any[]): Promise<boolean> {
    try {
      const csv = Papa.unparse(data);
      const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
      this.triggerDownload(`${filename}.csv`, blob);
      return true;
    } catch (e) {
      console.error('[ExportService] CSV export failed:', e);
      return false;
    }
  }

  async exportToExcel(filename: string, data: any[]): Promise<boolean> {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      this.triggerDownload(`${filename}.xlsx`, blob);
      return true;
    } catch (e) {
      console.error('[ExportService] Excel export failed:', e);
      return false;
    }
  }

  async exportToPDF(filename: string, data: any[]): Promise<boolean> {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFontSize(14);
      doc.text(`Report: ${filename}`, 20, 20);
      // Simple table rendering (header + rows)
      const startY = 30;
      const rowHeight = 8;
      const keys = data && data.length ? Object.keys(data[0]) : [];
      // Header
      keys.forEach((key, idx) => {
        doc.text(key, 20 + idx * 40, startY);
      });
      // Rows
      data.forEach((row, rowIdx) => {
        const y = startY + rowHeight * (rowIdx + 1);
        keys.forEach((key, colIdx) => {
          const text = row[key] !== undefined ? String(row[key]) : '';
          doc.text(text, 20 + colIdx * 40, y);
        });
      });
      const blob = doc.output('blob');
      this.triggerDownload(`${filename}.pdf`, blob);
      return true;
    } catch (e) {
      console.error('[ExportService] PDF export failed:', e);
      return false;
    }
  }
}

export const exportService = new RealExportService();
export default exportService;
