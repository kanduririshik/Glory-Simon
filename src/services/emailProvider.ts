import { supabase } from '../lib/supabase';

export interface SendEmailParams {
  enquiryId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  emailType: string;
  attachments?: { name: string; url?: string; base64?: string; mimeType?: string }[];
}

export interface IEmailProvider {
  sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; errorMessage?: string }>;
}

/**
 * Gmail Email Provider
 * Communicates with the secure backend Supabase Edge Function 'gmail-service'
 */
export class GmailProvider implements IEmailProvider {
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; errorMessage?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('gmail-service', {
        body: {
          action: 'send-email',
          enquiryId: params.enquiryId,
          recipientEmail: params.recipientEmail,
          subject: params.subject,
          body: params.body,
          emailType: params.emailType,
          attachments: params.attachments || []
        }
      });

      if (error) {
        console.error('[GmailProvider] Supabase Edge Function error:', error);
        return { 
          success: false, 
          errorMessage: error.message || 'Gmail Service Connection Refused' 
        };
      }

      if (data && data.success === false) {
        return {
          success: false,
          errorMessage: data.error || 'Failed to dispatch email via Gmail API'
        };
      }

      return {
        success: true,
        messageId: data?.messageId || 'em_msg_simulated_' + Math.random().toString(36).substr(2, 9)
      };
    } catch (err: any) {
      console.error('[GmailProvider] Client-side failure invoking Gmail Edge Function:', err);
      return {
        success: false,
        errorMessage: err?.message || 'Network exception invoking Gmail Service'
      };
    }
  }
}

/**
 * Unified Email Dispatcher Service
 * Wrap the active provider to allow easy configuration adjustments.
 */
class EmailProviderService {
  private activeProvider: IEmailProvider;

  constructor() {
    // Current active provider: Gmail.
    // To switch, swap this with another IEmailProvider implementation (e.g. ResendProvider)
    this.activeProvider = new GmailProvider();
  }

  setProvider(provider: IEmailProvider) {
    this.activeProvider = provider;
  }

  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; errorMessage?: string }> {
    return await this.activeProvider.sendEmail(params);
  }
}

export const emailProviderService = new EmailProviderService();
export default emailProviderService;
