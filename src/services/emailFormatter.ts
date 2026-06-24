import type { Enquiry, Quotation, SiteVisit, UserProfile } from '../types';
import { formatCurrencyINR } from '../utils/format';

export interface EmailRenderContext {
  enquiry?: Enquiry;
  quotation?: Quotation;
  siteVisit?: SiteVisit;
  assignedStaff?: UserProfile;
  assignedEngineer?: UserProfile;
  allProfiles?: UserProfile[];
  attachments?: { name: string; url?: string }[];
  customMilestone?: { title: string; status: string };
  updateDetails?: string;
}

/**
 * Converts markdown-like markup to inline-styled HTML
 */
export function parseMarkdownToHtml(text: string): string {
  if (!text) return '';

  let html = text;

  // Replace headers: ## Heading -> h3, ### Heading -> h4
  html = html.replace(/^### (.*?)$/gm, '<h4 style="color: #D4A65A; font-family: Georgia, serif; font-size: 14px; margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">$1</h4>');
  html = html.replace(/^## (.*?)$/gm, '<h3 style="color: #D4A65A; font-family: Georgia, serif; font-size: 16px; margin: 20px 0 10px 0; border-bottom: 1px solid rgba(212,166,90,0.1); padding-bottom: 5px;">$1</h3>');
  html = html.replace(/^# (.*?)$/gm, '<h2 style="color: #D4A65A; font-family: Georgia, serif; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 1px solid rgba(212,166,90,0.2); padding-bottom: 5px;">$1</h2>');

  // Replace bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #E6C27A; font-weight: 600;">$1</strong>');
  
  // Replace italic: *text* -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, '<em style="color: #CBBEAB; font-style: italic;">$1</em>');

  // Split into lines to parse lists and paragraphs
  const lines = html.split('\n');
  let result = [];
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      continue;
    }

    // Bullet lists: - item or * item
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (!inList) {
        result.push('<ul style="margin: 0 0 15px 20px; padding: 0; list-style-type: square; color: #CBBEAB;">');
        inList = true;
      }
      result.push(`<li style="margin-bottom: 5px; line-height: 1.6; font-size: 13.5px;">${bulletMatch[1]}</li>`);
      continue;
    }

    // Numbered lists: 1. item
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (!inOrderedList) {
        result.push('<ol style="margin: 0 0 15px 20px; padding: 0; color: #CBBEAB;">');
        inOrderedList = true;
      }
      result.push(`<li style="margin-bottom: 5px; line-height: 1.6; font-size: 13.5px;">${numberedMatch[2]}</li>`);
      continue;
    }

    // Close open lists if regular paragraph
    if (inList) {
      result.push('</ul>');
      inList = false;
    }
    if (inOrderedList) {
      result.push('</ol>');
      inOrderedList = false;
    }

    // If it's already an HTML block (e.g. h2/h3/h4), push it directly, else wrap in paragraph
    if (line.startsWith('<h') || line.startsWith('<div') || line.startsWith('<table')) {
      result.push(line);
    } else {
      result.push(`<p style="margin: 0 0 15px 0; line-height: 1.6; font-size: 13.5px; color: #F5F1EA;">${line}</p>`);
    }
  }

  // Close lists at the end
  if (inList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');

  return result.join('\n');
}

/**
 * Strips HTML content to plain text for email preview snippets.
 * Removes DOCTYPE, script/style tags, inline CSS, and all HTML tags.
 * Collapses whitespace and truncates to a reasonable length.
 */
export function extractEmailPreview(html: string, maxLength: number = 200): string {
  if (!html) return '';
  // Remove DOCTYPE
  let text = html.replace(/<!DOCTYPE[^>]*>/gi, '');
  // Remove script and style blocks
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode HTML entities (basic)
  const txtArea = document.createElement('textarea');
  txtArea.innerHTML = text;
  text = txtArea.value;
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Truncate
  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  return text;
}


/**
 * Replaces placeholders in template string with CRM values
 */
export function replacePlaceholders(templateText: string, context: EmailRenderContext): string {
  if (!templateText) return '';

  const enquiry = context.enquiry;
  const quote = context.quotation;
  const visit = context.siteVisit;
  const staff = context.assignedStaff;
  const engineer = context.assignedEngineer;

  // Formatting helpers
  const fmtCurrency = (val?: number) => (val !== undefined ? formatCurrencyINR(val) : '—');
  const fmtDate = (dStr?: string) => {
    if (!dStr) return '—';
    try {
      return new Date(dStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dStr;
    }
  };
  const fmtTime = (dStr?: string) => {
    if (!dStr) return '—';
    try {
      return new Date(dStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dStr;
    }
  };

  const replacements: Record<string, string> = {
    '{clientName}': enquiry?.clientName || 'Valued Client',
    '{projectName}': enquiry ? `${enquiry.projectType} at ${enquiry.location}` : 'Luxury Interior Project',
    '{quotationNumber}': quote?.quotationNumber || '—',
    '{invoiceNumber}': quote?.quotationNumber ? quote.quotationNumber.replace('QT', 'INV') : '—',
    '{designerName}': staff?.fullName || 'Sarah Jenkins',
    '{engineerName}': engineer?.fullName || 'David Ross',
    '{staffName}': staff?.fullName || 'Sarah Jenkins',
    '{date}': visit ? fmtDate(visit.scheduledAt) : new Date().toLocaleDateString(),
    '{time}': visit ? fmtTime(visit.scheduledAt) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    '{location}': enquiry?.location || 'Site Location',
    '{amount}': quote ? fmtCurrency(quote.amount) : '—',
    '{phone}': enquiry?.phoneNumber || '—',
    '{email}': enquiry?.email || '—',
    '{milestoneTitle}': context.customMilestone?.title || 'Concept Sourcing',
    '{milestoneStatus}': context.customMilestone?.status || 'In Progress',
    '{projectStatus}': enquiry?.status || 'Active',
    '{siteVisitDate}': visit ? fmtDate(visit.scheduledAt) : '—',
    '{siteVisitTime}': visit ? fmtTime(visit.scheduledAt) : '—',
    '{updateDetails}': context.updateDetails || 'Work is progressing smoothly.'
  };

  let result = templateText;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), value);
  });

  return result;
}

/**
 * Builds the complete enterprise HTML email layout
 */
export function buildEnterpriseEmailHtml(bodyText: string, context: EmailRenderContext, emailType: string): string {
  // First replace placeholders in the raw body text
  const populatedBody = replacePlaceholders(bodyText, context);
  
  // Parse paragraphs, markdown etc. in body
  const parsedBodyHtml = parseMarkdownToHtml(populatedBody);

  const enquiry = context.enquiry;
  const quote = context.quotation;
  const visit = context.siteVisit;
  
  // Determine if it is a quotation or invoice type
  const isQuotation = emailType.toLowerCase().includes('quotation') || !!quote;
  const isInvoice = emailType.toLowerCase().includes('invoice') || (quote?.status === 'Approved' && emailType.toLowerCase().includes('invoice'));

  // 1. PROJECT SUMMARY BLOCK
  let projectSummaryBlock = '';
  if (enquiry && ['Confirmed', 'Project Confirmed', 'Won', 'Active Project', 'In Progress', 'Completed'].includes(enquiry.status as string)) {
    const startStr = enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    const endStr = enquiry.createdAt ? new Date(new Date(enquiry.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'TBD';
    const statusStr = enquiry.status as string;
    const progress = statusStr === 'Completed' ? 100 : (statusStr === 'In Progress' ? 65 : 15);
    const projStatus = statusStr === 'Confirmed' ? 'Execution Kickoff' : (statusStr === 'In Progress' ? 'Design Development' : statusStr);

    projectSummaryBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.15); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(212, 166, 90, 0.05); padding: 12px 18px; border-bottom: 1px solid rgba(212, 166, 90, 0.15); color: #D4A65A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Project Status Dashboard
        </div>
        <div style="padding: 18px; color: #CBBEAB; font-size: 13px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
            <tr>
              <td width="50%" style="padding: 4px 0; color: #8B7355;">Project Name:</td>
              <td style="padding: 4px 0; color: #F5F1EA; font-weight: bold;">${enquiry.projectType} at ${enquiry.location}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Type:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${enquiry.projectType}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Location:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${enquiry.location}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Status:</td>
              <td style="padding: 4px 0;"><span style="color: #9BCF8A; font-weight: bold; background-color: rgba(155, 207, 138, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 11px; border: 1px solid rgba(155, 207, 138, 0.2);">${projStatus}</span></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Start Date:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${startStr}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Target Completion:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${endStr}</td>
            </tr>
          </table>
          <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; font-weight: bold;">
              <span style="color: #8B7355; text-transform: uppercase;">Overall Completion</span>
              <span style="color: #D4A65A; font-family: monospace;">${progress}%</span>
            </div>
            <div style="background-color: #050505; border: 1px solid rgba(212, 166, 90, 0.15); border-radius: 4px; height: 10px; overflow: hidden; width: 100%;">
              <div style="background-color: #D4A65A; height: 100%; width: ${progress}%;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. CLIENT DETAILS CARD (Phase 3)
  let clientDetailsBlock = '';
  if (enquiry) {
    clientDetailsBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.15); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(212, 166, 90, 0.05); padding: 12px 18px; border-bottom: 1px solid rgba(212, 166, 90, 0.15); color: #D4A65A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Client Information
        </div>
        <div style="padding: 18px; color: #CBBEAB; font-size: 13px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40%" style="padding: 4px 0; color: #8B7355;">Client Name:</td>
              <td style="padding: 4px 0; color: #F5F1EA; font-weight: bold;">${enquiry.clientName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Email:</td>
              <td style="padding: 4px 0; color: #F5F1EA;"><a href="mailto:${enquiry.email}" style="color: #D4A65A; text-decoration: none;">${enquiry.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Phone:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${enquiry.phoneNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Enquiry ID:</td>
              <td style="padding: 4px 0; color: #CBBEAB; font-family: monospace; font-size: 11px;">${enquiry.id.substring(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Project Type:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${enquiry.projectType}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Location:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${enquiry.location}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  }

  // 3. PROJECT TEAM DIRECTORY (Phase 4)
  let teamBlock = '';
  if (context.allProfiles && context.allProfiles.length > 0) {
    const listPM = context.allProfiles.filter(p => p.role === 'Project Manager');
    const listDesigner = context.allProfiles.filter(p => p.role === 'Interior Designer');
    const listEngineer = context.allProfiles.filter(p => p.role === 'Site Engineer');
    const listCRE = context.allProfiles.filter(p => p.role === 'Client Relationship Manager');
    const listProcure = context.allProfiles.filter(p => p.role === 'Procurement Coordinator' || p.role === 'Vendor Manager');

    const pm = listPM[0] || { fullName: 'Sarah PM', role: 'Project Manager', email: 'sarah.pm@glorysimon.com', phoneNumber: '+91 98765 43210' };
    const designer = context.assignedStaff || listDesigner[0] || { fullName: 'John Matthew', role: 'Lead Interior Designer', email: 'john@glorysimon.com', phoneNumber: '+91 98765 43211' };
    const siteEng = context.assignedEngineer || listEngineer[0] || { fullName: 'Rahul Sharma', role: 'Site Engineer', email: 'rahul@glorysimon.com', phoneNumber: '+91 98765 43212' };
    const procure = listProcure[0] || { fullName: 'David Joseph', role: 'Procurement Coordinator', email: 'david@glorysimon.com', phoneNumber: '+91 98765 43213' };
    const cre = listCRE[0] || { fullName: 'Priya Reddy', role: 'Customer Relations Executive', email: 'priya@glorysimon.com', phoneNumber: '+91 98765 43214' };
    const accountsRep = { fullName: 'Amit Saxena', role: 'Accounts Representative', email: 'billing@glorysimon.com', phoneNumber: '+91 98765 43215' };

    teamBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.15); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(212, 166, 90, 0.05); padding: 12px 18px; border-bottom: 1px solid rgba(212, 166, 90, 0.15); color: #D4A65A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Assigned Project Team
        </div>
        <div style="padding: 18px; overflow-x: auto;">
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px; border-collapse: collapse; min-width: 450px;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(212, 166, 90, 0.25); text-align: left; color: #D4A65A; font-family: monospace; font-size: 10px; text-transform: uppercase;">
                <th style="padding: 8px 4px;">Role</th>
                <th style="padding: 8px 4px;">Representative</th>
                <th style="padding: 8px 4px;">Contact</th>
              </tr>
            </thead>
            <tbody style="color: #CBBEAB;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 4px; font-weight: bold; color: #F5F1EA;">Project Manager</td>
                <td style="padding: 8px 4px;">${pm.fullName}</td>
                <td style="padding: 8px 4px;"><a href="mailto:${pm.email}" style="color: #D4A65A; text-decoration: none;">${pm.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 4px; font-weight: bold; color: #F5F1EA;">Lead Designer</td>
                <td style="padding: 8px 4px;">${designer.fullName}</td>
                <td style="padding: 8px 4px;"><a href="mailto:${designer.email}" style="color: #D4A65A; text-decoration: none;">${designer.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 4px; font-weight: bold; color: #F5F1EA;">Site Engineer</td>
                <td style="padding: 8px 4px;">${siteEng.fullName}</td>
                <td style="padding: 8px 4px;"><a href="mailto:${siteEng.email}" style="color: #D4A65A; text-decoration: none;">${siteEng.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 4px; font-weight: bold; color: #F5F1EA;">Procurement</td>
                <td style="padding: 8px 4px;">${procure.fullName}</td>
                <td style="padding: 8px 4px;"><a href="mailto:${procure.email}" style="color: #D4A65A; text-decoration: none;">${procure.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 4px; font-weight: bold; color: #F5F1EA;">Customer Relations</td>
                <td style="padding: 8px 4px;">${cre.fullName}</td>
                <td style="padding: 8px 4px;"><a href="mailto:${cre.email}" style="color: #D4A65A; text-decoration: none;">${cre.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 4px; font-weight: bold; color: #F5F1EA;">Accounts Rep</td>
                <td style="padding: 8px 4px;">${accountsRep.fullName}</td>
                <td style="padding: 8px 4px;"><a href="mailto:${accountsRep.email}" style="color: #D4A65A; text-decoration: none;">${accountsRep.email}</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 4. QUOTATION SUMMARY TABLE (Phase 5)
  let quotationSummaryBlock = '';
  if (isQuotation && quote) {
    const subtotal = Math.round(quote.amount / 1.1);
    const tax = quote.amount - subtotal;
    const materialCost = Math.round(subtotal * 0.6);
    const labourCost = Math.round(subtotal * 0.25);
    const designCost = Math.round(subtotal * 0.15);
    const validUntilDate = new Date(new Date(quote.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

    quotationSummaryBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.3); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(212, 166, 90, 0.07); padding: 12px 18px; border-bottom: 1px solid rgba(212, 166, 90, 0.2); color: #D4A65A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Quotation Proposal Ledger
        </div>
        <div style="padding: 18px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #CBBEAB; margin-bottom: 15px;">
            <tr>
              <td width="50%" style="padding: 4px 0; color: #8B7355;">Quotation Number:</td>
              <td style="padding: 4px 0; color: #F5F1EA; font-weight: bold; font-family: monospace;">${quote.quotationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Created Date:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${new Date(quote.createdAt).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Valid Until:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${validUntilDate}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Status:</td>
              <td style="padding: 4px 0;"><span style="color: #E6C27A; font-weight: bold; background-color: rgba(212, 166, 90, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 11px; border: 1px solid rgba(212,166,90,0.2);">${quote.status.toUpperCase()}</span></td>
            </tr>
          </table>

          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px; border-collapse: collapse; background-color: #050505; border: 1px solid rgba(212, 166, 90, 0.1); border-radius: 6px; overflow: hidden; margin-top: 10px;">
            <thead>
              <tr style="background-color: rgba(255,255,255,0.02); text-align: left; color: #D4A65A; border-bottom: 1px solid rgba(212, 166, 90, 0.15);">
                <th style="padding: 8px;">Cost Specification</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody style="color: #CBBEAB;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px;">Premium Sourced Materials</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">₹${materialCost.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px;">Master Artisans & Sourcing Labor</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">₹${labourCost.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px;">Bespoke Design, Layout & Blueprints</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">₹${designCost.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(212, 166, 90, 0.15);">
                <td style="padding: 8px; color: #8B7355;">Luxury Tax (10% GST)</td>
                <td style="padding: 8px; text-align: right; color: #8B7355; font-family: monospace;">₹${tax.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background-color: rgba(212,166,90,0.04);">
                <td style="padding: 10px; font-weight: bold; color: #D4A65A;">GRAND TOTAL</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #D4A65A; font-size: 14px; font-family: monospace;">₹${quote.amount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 5. INVOICE SUMMARY TABLE (Phase 6)
  let invoiceSummaryBlock = '';
  if (isInvoice && quote) {
    const invoiceNumber = quote.quotationNumber.replace('QT', 'INV');
    const subtotal = Math.round(quote.amount / 1.1);
    const tax = quote.amount - subtotal;
    const paymentInstructions = 'Please initiate bank wire transfer to Glory Simon Interiors Escrow Account. Quote Invoice reference in details.';

    invoiceSummaryBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(155, 207, 138, 0.3); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(155, 207, 138, 0.05); padding: 12px 18px; border-bottom: 1px solid rgba(155, 207, 138, 0.2); color: #9BCF8A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Sourcing Invoice Details
        </div>
        <div style="padding: 18px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #CBBEAB; margin-bottom: 15px;">
            <tr>
              <td width="50%" style="padding: 4px 0; color: #8B7355;">Invoice Number:</td>
              <td style="padding: 4px 0; color: #F5F1EA; font-weight: bold; font-family: monospace;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Issue Date:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${new Date(quote.updatedAt).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Due Date:</td>
              <td style="padding: 4px 0; color: #9BCF8A; font-weight: bold;">DUE ON RECEIPT</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Payment Status:</td>
              <td style="padding: 4px 0;"><span style="color: #9BCF8A; font-weight: bold; background-color: rgba(155, 207, 138, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 11px; border: 1px solid rgba(155, 207, 138, 0.2);">DUE</span></td>
            </tr>
          </table>

          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px; border-collapse: collapse; background-color: #050505; border: 1px solid rgba(155, 207, 138, 0.1); border-radius: 6px; overflow: hidden;">
            <tbody style="color: #CBBEAB;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px;">Subtotal Amount</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">₹${subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px;">Luxury Tax (10%)</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">₹${tax.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(155, 207, 138, 0.15);">
                <td style="padding: 8px; color: #8B7355;">Balance Due</td>
                <td style="padding: 8px; text-align: right; color: #9BCF8A; font-weight: bold; font-family: monospace;">₹${quote.amount.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background-color: rgba(155, 207, 138, 0.04);">
                <td style="padding: 10px; font-weight: bold; color: #9BCF8A;">TOTAL AMOUNT</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #9BCF8A; font-size: 14px; font-family: monospace;">₹${quote.amount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 15px; padding: 12px; background-color: #050505; border: 1px dashed rgba(212,166,90,0.2); border-radius: 6px; font-size: 11px; line-height: 1.4; color: #CBBEAB;">
            <strong style="color: #D4A65A; display: block; margin-bottom: 3px;">Payment Instructions:</strong>
            ${paymentInstructions}
          </div>
        </div>
      </div>
    `;
  }

  // 6. PROJECT TIMELINE (Phase 7)
  let timelineBlock = '';
  if (enquiry && ['Confirmed', 'Project Confirmed', 'Won', 'Active Project', 'In Progress', 'Completed'].includes(enquiry.status as string)) {
    const currentStatus = enquiry.status as string;

    // Timeline phases
    const phases = [
      { key: 'consultation', label: 'Initial Consultation', completed: true },
      { key: 'concept', label: 'Concept Design', completed: true },
      { key: 'material', label: 'Material Selection', completed: currentStatus !== 'Confirmed' },
      { key: 'procure', label: 'Procurement', completed: ['In Progress', 'Completed'].includes(currentStatus) },
      { key: 'execution', label: 'Execution', completed: currentStatus === 'Completed' },
      { key: 'inspection', label: 'Site Inspection', completed: currentStatus === 'Completed' },
      { key: 'handover', label: 'Final Handover', completed: currentStatus === 'Completed' }
    ];

    let timelineRows = '';
    phases.forEach((p) => {
      const bulletColor = p.completed ? '#D4A65A' : '#333333';
      const labelColor = p.completed ? '#F5F1EA' : '#8B7355';
      const indicator = p.completed ? '✓' : '•';
      const fontWeight = p.completed ? 'bold' : 'normal';

      timelineRows += `
        <tr style="font-size: 12px; font-family: sans-serif;">
          <td width="24" style="vertical-align: middle; text-align: center; padding: 4px 0;">
            <div style="height: 16px; width: 16px; border-radius: 50%; background-color: ${bulletColor}; color: #050505; text-align: center; font-size: 10px; line-height: 16px; font-weight: bold; display: inline-block;">
              ${indicator}
            </div>
          </td>
          <td style="padding: 4px 10px; color: ${labelColor}; font-weight: ${fontWeight};">
            ${p.label}
          </td>
          <td style="padding: 4px 0; text-align: right; color: #8B7355; font-size: 10px; font-family: monospace;">
            ${p.completed ? 'COMPLETED' : 'UPCOMING'}
          </td>
        </tr>
      `;
    });

    timelineBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.15); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(212, 166, 90, 0.05); padding: 12px 18px; border-bottom: 1px solid rgba(212, 166, 90, 0.15); color: #D4A65A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Project Milestone Timeline
        </div>
        <div style="padding: 18px;">
          <table width="100%" cellpadding="4" cellspacing="0">
            ${timelineRows}
          </table>
        </div>
      </div>
    `;
  }

  // 7. SITE VISIT DETAILS (Phase 8)
  let siteVisitBlock = '';
  if (visit) {
    const engineerName = context.assignedEngineer?.fullName || 'Senior Engineer';
    const designerName = context.assignedStaff?.fullName || 'Sarah PM';

    siteVisitBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.15); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(212, 166, 90, 0.05); padding: 12px 18px; border-bottom: 1px solid rgba(212, 166, 90, 0.15); color: #D4A65A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Site Visit Details
        </div>
        <div style="padding: 18px; color: #CBBEAB; font-size: 13px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40%" style="padding: 4px 0; color: #8B7355;">Date:</td>
              <td style="padding: 4px 0; color: #F5F1EA; font-weight: bold;">${new Date(visit.scheduledAt).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Time:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Assigned Designer:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${designerName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Site Engineer:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${engineerName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Purpose:</td>
              <td style="padding: 4px 0; color: #F5F1EA;">${visit.notes || 'Routine Site Inspection & Dimensions Review'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #8B7355;">Location:</td>
              <td style="padding: 4px 0; color: #F5F1EA; font-weight: bold;">${enquiry?.location || 'Hyderabad Site Office'}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  }

  // 8. ATTACHMENT CENTER
  let attachmentBlock = '';
  if (context.attachments && context.attachments.length > 0) {
    let listItems = '';
    context.attachments.forEach(att => {
      listItems += `
        <tr style="font-size: 12px;">
          <td style="padding: 6px 0; color: #D4A65A; font-family: monospace;">📎 ${att.name}</td>
          <td style="padding: 6px 0; text-align: right;">
            ${att.url ? `<a href="${att.url}" target="_blank" style="color: #D4A65A; text-decoration: none; font-weight: bold; border-bottom: 1px solid rgba(212,166,90,0.3); padding-bottom: 1px;">Open Attachment</a>` : '<span style="color: #8B7355;">In Transit</span>'}
          </td>
        </tr>
      `;
    });

    attachmentBlock = `
      <div style="margin-bottom: 25px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.15); border-radius: 8px; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: rgba(212, 166, 90, 0.05); padding: 12px 18px; border-bottom: 1px solid rgba(212, 166, 90, 0.15); color: #D4A65A; font-weight: bold; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Attachment Center
        </div>
        <div style="padding: 18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${listItems}
          </table>
        </div>
      </div>
    `;
  }

  // 9. CLIENT PORTAL ACTION BUTTONS
  let actionButtonsBlock = '';
  if (enquiry) {
    const viewProjUrl = `https://www.glorysimoninteriors.com/portal/projects/${enquiry.id}`;
    const viewQuoteUrl = quote ? `https://www.glorysimoninteriors.com/portal/quotations/${quote.id}` : '#';
    const viewInvoiceUrl = quote && quote.status === 'Approved' ? `https://www.glorysimoninteriors.com/portal/invoices/${quote.id}` : '#';

    actionButtonsBlock = `
      <div style="margin-bottom: 30px; text-align: center; font-family: sans-serif; padding-top: 10px;">
        <a href="${viewProjUrl}" target="_blank" style="display: inline-block; background-color: #D4A65A; color: #050505; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 4px 6px;">View Project</a>
        ${quote ? `<a href="${viewQuoteUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #D4A65A; border: 1px solid #D4A65A; font-weight: bold; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 4px 6px;">View Quotation</a>` : ''}
        ${quote && quote.status === 'Approved' ? `<a href="${viewInvoiceUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #9BCF8A; border: 1px solid #9BCF8A; font-weight: bold; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 4px 6px;">View Invoice</a>` : ''}
        <a href="mailto:support@glorysimoninteriors.com" style="display: inline-block; background-color: #111111; color: #CBBEAB; border: 1px solid rgba(255,255,255,0.15); font-weight: bold; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 4px 6px;">Contact Team</a>
      </div>
    `;
  }

  // Compile final premium HTML string
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Glory Simon Interiors</title>
      <style>
        body { margin: 0; padding: 0; background-color: #050505; color: #F5F1EA; font-family: sans-serif; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; color: #F5F1EA; font-family: sans-serif;">
      <div style="background-color: #050505; color: #F5F1EA; font-family: 'Outfit', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px 15px; margin: 0; min-height: 100%;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111111; border: 1px solid rgba(212, 166, 90, 0.2); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 1px solid rgba(212, 166, 90, 0.15);">
              <h1 style="color: #D4A65A; font-family: Georgia, serif; font-size: 23px; font-weight: bold; letter-spacing: 2.5px; margin: 0 0 5px 0; text-transform: uppercase;">GLORY SIMON INTERIORS</h1>
              <p style="color: #CBBEAB; font-size: 9.5px; text-transform: uppercase; letter-spacing: 3px; margin: 0;">Luxury Architectural Spaces</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 30px 30px 15px 30px; font-size: 13.5px; line-height: 1.6; color: #F5F1EA;">
              ${parsedBodyHtml}
            </td>
          </tr>
          
          <!-- Dynamic details cards & tables -->
          <tr>
            <td style="padding: 0 30px 10px 30px;">
              ${projectSummaryBlock}
              ${clientDetailsBlock}
              ${teamBlock}
              ${quotationSummaryBlock}
              ${invoiceSummaryBlock}
              ${siteVisitBlock}
              ${timelineBlock}
              ${attachmentBlock}
              ${actionButtonsBlock}
            </td>
          </tr>
          
          <!-- Footer Signature -->
          <tr>
            <td style="padding: 20px 30px 30px 30px; border-top: 1px solid rgba(212, 166, 90, 0.15); font-size: 12px; color: #CBBEAB; background-color: rgba(0,0,0,0.15);">
              <p style="margin: 0 0 12px 0; color: #F5F1EA; font-size: 13px;">Warm Regards,</p>
              <p style="margin: 0; font-weight: bold; color: #D4A65A; font-size: 13px;">Glory Simon Interiors</p>
              <p style="margin: 0 0 15px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #8B7355;">Project Management Office</p>
              <table cellpadding="0" cellspacing="0" style="font-size: 11.5px; color: #CBBEAB; line-height: 1.5;">
                <tr>
                  <td style="padding-right: 8px; color: #8B7355;">Email:</td>
                  <td><a href="mailto:kanduririshik@gmail.com" style="color: #D4A65A; text-decoration: none;">kanduririshik@gmail.com</a></td>
                </tr>
                <tr>
                  <td style="padding-right: 8px; color: #8B7355;">Support:</td>
                  <td><a href="mailto:support@glorysimoninteriors.com" style="color: #D4A65A; text-decoration: none;">support@glorysimoninteriors.com</a></td>
                </tr>
                <tr>
                  <td style="padding-right: 8px; color: #8B7355;">Phone:</td>
                  <td>+91 XXXXX XXXXX</td>
                </tr>
                <tr>
                  <td style="padding-right: 8px; color: #8B7355;">Website:</td>
                  <td><a href="http://www.glorysimoninteriors.com" target="_blank" style="color: #D4A65A; text-decoration: none;">www.glorysimoninteriors.com</a></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  // Minify the HTML strictly to satisfy Gmail Edge Function's line wrapping and newline replacement
  return html.replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}
