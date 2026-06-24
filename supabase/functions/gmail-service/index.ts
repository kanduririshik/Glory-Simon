import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS Preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { action, enquiryId, recipientEmail, subject, body: emailBody, emailType, attachments } = body

    const clientId = Deno.env.get('GMAIL_CLIENT_ID')
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET')
    const refreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN')
    const productionMode = !!(clientId && clientSecret && refreshToken)

    if (action === 'get-status') {
      let connected = false
      let lastSuccessfulSend: string | null = null
      let lastError: string | null = null

      if (productionMode) {
        try {
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId!,
              client_secret: clientSecret!,
              refresh_token: refreshToken!,
              grant_type: 'refresh_token',
            }).toString()
          })
          if (tokenResponse.ok) {
            connected = true
          }
        } catch (err) {
          console.error('[GmailService] Dry-run token refresh failed:', err)
        }
      }

      try {
        const { data: successData } = await supabaseClient
          .from('email_logs')
          .select('sent_at')
          .eq('status', 'delivered')
          .order('sent_at', { ascending: false })
          .limit(1)

        if (successData && successData.length > 0) {
          lastSuccessfulSend = successData[0].sent_at
        }

        const { data: errorData } = await supabaseClient
          .from('email_logs')
          .select('error_message')
          .eq('status', 'failed')
          .order('sent_at', { ascending: false })
          .limit(1)

        if (errorData && errorData.length > 0) {
          lastError = errorData[0].error_message
        }
      } catch (dbErr) {
        console.error('[GmailService] DB status fetch error:', dbErr)
      }

      return new Response(JSON.stringify({
        connected,
        productionMode,
        senderEmail: 'kanduririshik@gmail.com',
        lastSuccessfulSend,
        lastError
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action !== 'send-email') {
      return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Toggles between Simulation and Production
    const isProduction = productionMode
    
    let status: 'queued' | 'sent' | 'delivered' | 'failed' = 'delivered'
    let messageId = ''
    let errorMessage: string | null = null

    console.log(`[GmailService] Processing ${emailType} email. Production Mode: ${isProduction}`);

    if (isProduction) {
      try {
        // 1. Refresh Gmail Access Token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: refreshToken!,
            grant_type: 'refresh_token',
          }).toString()
        })

        if (!tokenResponse.ok) {
          const errData = await tokenResponse.json()
          throw new Error(`Token refresh failed: ${JSON.stringify(errData)}`)
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        // 2. Format RFC 2822 Multipart Email
        const sender = 'kanduririshik@gmail.com'
        const boundary = `----=_Boundary_${Math.random().toString(36).substring(2)}`
        
        let rawMessage = [
          `From: ${sender}`,
          `To: ${recipientEmail}`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          `Content-Type: text/html; charset="UTF-8"`,
          `Content-Transfer-Encoding: 7bit`,
          '',
          `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #111;">${emailBody.replace(/\n/g, '<br>')}</div>`,
          ''
        ].join('\r\n')

        // Append attachments if present
        if (attachments && attachments.length > 0) {
          for (const att of attachments) {
            // att.base64 is already base64 string
            const base64Data = att.base64 || ''
            const mimeType = att.mimeType || 'application/pdf'
            
            rawMessage += [
              `--${boundary}`,
              `Content-Type: ${mimeType}; name="${att.name}"`,
              `Content-Description: ${att.name}`,
              `Content-Disposition: attachment; filename="${att.name}"`,
              `Content-Transfer-Encoding: base64`,
              '',
              base64Data,
              ''
            ].join('\r\n')
          }
        }

        rawMessage += `--${boundary}--`

        // Base64Url encode raw message
        const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '')

        // 3. Dispatch via Google Gmail API
        const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedMessage })
        })

        if (!gmailResponse.ok) {
          const errText = await gmailResponse.text()
          throw new Error(`Gmail API send failed: ${errText}`)
        }

        const gmailData = await gmailResponse.json()
        messageId = gmailData.id
        status = 'delivered'
      } catch (err: any) {
        console.error('[GmailService] Production send exception:', err)
        status = 'failed'
        errorMessage = err.message || 'Unknown Gmail API send error'
      }
    } else {
      // Simulation Mode: simulated delay & auto success
      await new Promise((resolve) => setTimeout(resolve, 800))
      messageId = 'sim_msg_' + Math.random().toString(36).substr(2, 9)
      status = 'delivered'
    }

    // 4. Save to Database: email_logs
    const logObj = {
      enquiry_id: enquiryId || null,
      recipient_email: recipientEmail,
      subject,
      body: emailBody,
      email_type: emailType,
      status,
      message_id: messageId || null,
      error_message: errorMessage,
      attachments: JSON.stringify(
        (attachments || []).map((att: any) => ({ name: att.name, url: att.url || '' }))
      ),
      sent_at: new Date().toISOString()
    }

    const { error: dbError } = await supabaseClient
      .from('email_logs')
      .insert(logObj)

    if (dbError) {
      console.error('[GmailService] Database logging error:', dbError)
    }

    // 5. Save to Database: notifications (Customer notifications)
    const notifyObj = {
      title: `${emailType} Email Sent`,
      message: `An automated ${emailType.toLowerCase()} email was successfully delivered to ${recipientEmail}.`,
      type: status === 'failed' ? 'error' : 'success',
      read: false,
      enquiry_id: enquiryId || null,
    }

    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert(notifyObj)

    if (notifError) {
      console.error('[GmailService] Notification inserting error:', notifError)
    }

    return new Response(JSON.stringify({ 
      success: status === 'delivered', 
      messageId, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error('[GmailService] Critical exception:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
