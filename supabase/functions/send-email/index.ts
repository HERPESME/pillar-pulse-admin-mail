
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation and sanitization
function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;')
}

function validateEmailInput(pillar: string, subject: string, content: string) {
  const errors: string[] = []
  
  if (!pillar?.trim()) {
    errors.push('Pillar is required')
  }
  
  if (!subject?.trim()) {
    errors.push('Subject is required')
  } else if (subject.length > 200) {
    errors.push('Subject must be less than 200 characters')
  }
  
  if (!content?.trim()) {
    errors.push('Content is required')
  } else if (content.length > 10000) {
    errors.push('Content must be less than 10,000 characters')
  }
  
  return errors
}

async function logAdminAction(supabaseClient: any, userId: string, action: string, details: any, req: Request) {
  try {
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'Unknown'
    
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: userId,
        action,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging failure shouldn't block the main operation
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      await logAdminAction(supabaseClient, 'unknown', 'unauthorized_email_attempt', { error: 'Invalid token' }, req)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminUser) {
      await logAdminAction(supabaseClient, user.id, 'unauthorized_email_attempt', { reason: 'Not an admin user' }, req)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    const { pillar, subject, content } = requestBody

    // Validate input
    const validationErrors = validateEmailInput(pillar, subject, content)
    if (validationErrors.length > 0) {
      await logAdminAction(supabaseClient, user.id, 'email_validation_failed', { errors: validationErrors, pillar }, req)
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get employees for the specified pillar
    const { data: employees, error: employeesError } = await supabaseClient
      .from('employees')
      .select('name, email')
      .eq('pillar', pillar)

    if (employeesError) {
      console.error('Database error:', employeesError)
      await logAdminAction(supabaseClient, user.id, 'email_database_error', { pillar, error: employeesError.message }, req)
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve employee data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!employees || employees.length === 0) {
      await logAdminAction(supabaseClient, user.id, 'email_no_recipients', { pillar }, req)
      return new Response(
        JSON.stringify({ error: 'No employees found for the specified pillar' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the email send attempt
    await logAdminAction(supabaseClient, user.id, 'email_send_initiated', { 
      pillar, 
      subject: subject.substring(0, 100), // Truncate for logging
      recipientCount: employees.length 
    }, req)

    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      // Send actual emails using Resend
      const emailPromises = employees.map(async (employee) => {
        try {
          // Sanitize content for HTML email
          const sanitizedContent = content.replace(/\n/g, '<br>')
          
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Admin Portal <onboarding@resend.dev>',
              to: [employee.email],
              subject: subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #8B4513;">Message from Admin Portal</h2>
                  <p>Dear ${sanitizeHtml(employee.name)},</p>
                  <div style="background-color: #FDF5E6; padding: 20px; border-left: 4px solid #D2B48C; margin: 20px 0;">
                    ${sanitizedContent}
                  </div>
                  <p>Best regards,<br>Admin Portal Team</p>
                </div>
              `,
            }),
          })
          
          const result = await response.json()
          
          if (!response.ok) {
            console.error(`Resend API error for ${employee.email}:`, result)
            throw new Error(result.message || `HTTP ${response.status}: Failed to send email`)
          }
          
          return { success: true, email: employee.email }
        } catch (error) {
          console.error(`Failed to send email to ${employee.email}:`, error)
          return { success: false, email: employee.email, error: error.message }
        }
      })
      
      const results = await Promise.all(emailPromises)
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      
      // Log the final result
      await logAdminAction(supabaseClient, user.id, 'email_send_completed', { 
        pillar, 
        successCount, 
        failureCount,
        totalRecipients: employees.length
      }, req)
      
      if (failureCount > 0) {
        const failures = results.filter(r => !r.success)
        console.log('Failed emails:', failures)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Emails sent successfully to ${successCount} employees in ${pillar} pillar`,
          recipients: successCount,
          failures: failureCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Fallback: Log email details (for testing without Resend)
      console.log(`Would send email to ${employees.length} employees in ${pillar} pillar`)
      
      await logAdminAction(supabaseClient, user.id, 'email_send_simulated', { 
        pillar, 
        recipientCount: employees.length,
        note: 'RESEND_API_KEY not configured'
      }, req)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email simulated for ${employees.length} employees in ${pillar} pillar (RESEND_API_KEY not configured)`,
          recipients: employees.length,
          note: 'Configure RESEND_API_KEY to send actual emails'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in send-email function:', error)
    
    // Return generic error message to prevent information disclosure
    return new Response(
      JSON.stringify({ error: 'Internal server error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
