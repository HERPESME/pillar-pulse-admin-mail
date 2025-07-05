import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Enhanced HTML sanitization to prevent XSS
function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    // Remove potentially dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove script tags and event handlers
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
}

// Enhanced input validation
function validateEmailInput(pillar: string, subject: string, content: string) {
  const errors: string[] = []
  
  // Pillar validation
  if (!pillar?.trim()) {
    errors.push('Pillar is required')
  } else if (typeof pillar !== 'string' || pillar.length > 100) {
    errors.push('Invalid pillar format')
  } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(pillar)) {
    errors.push('Pillar contains invalid characters')
  }
  
  // Subject validation
  if (!subject?.trim()) {
    errors.push('Subject is required')
  } else if (typeof subject !== 'string' || subject.length > 200) {
    errors.push('Subject must be less than 200 characters')
  }
  
  // Content validation
  if (!content?.trim()) {
    errors.push('Content is required')
  } else if (typeof content !== 'string' || content.length > 10000) {
    errors.push('Content must be less than 10,000 characters')
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /data:/i,
    /vbscript:/i,
    /<link/i,
    /<meta/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ]
  
  const combinedText = `${subject} ${content}`
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(combinedText)) {
      errors.push('Content contains potentially unsafe elements')
      break
    }
  }
  
  return errors
}

// Rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  userLimit.count++
  return true
}

// Secure audit logging with input sanitization
async function logAdminAction(supabaseClient: any, userId: string, action: string, details: any, req: Request) {
  try {
    // Sanitize user agent and IP to prevent log injection
    const userAgent = (req.headers.get('user-agent') || 'Unknown').substring(0, 500)
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = (forwardedFor?.split(',')[0]?.trim() || realIp || 'Unknown').substring(0, 45)
    
    // Sanitize action and details
    const sanitizedAction = sanitizeHtml(action).substring(0, 100)
    const sanitizedDetails = typeof details === 'object' ? 
      JSON.parse(JSON.stringify(details).substring(0, 1000)) : 
      sanitizeHtml(String(details)).substring(0, 1000)
    
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: userId,
        action: sanitizedAction,
        details: sanitizedDetails,
        ip_address: ipAddress,
        user_agent: userAgent
      })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging failure shouldn't block the main operation
  }
}

// Secure error response function
function createErrorResponse(message: string, status: number = 400, logDetails?: any) {
  // Generic error messages to prevent information disclosure
  const genericMessages: { [key: number]: string } = {
    400: 'Invalid request parameters',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Resource not found',
    429: 'Too many requests',
    500: 'Internal server error'
  }
  
  const responseMessage = genericMessages[status] || 'An error occurred'
  
  return new Response(
    JSON.stringify({ error: responseMessage }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Gmail SMTP configuration
const smtpClient = new SmtpClient();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Initialize Supabase client with secure configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      return createErrorResponse('Service configuration error', 500)
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Authentication required', 401)
    }

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token || token.length < 10) {
      return createErrorResponse('Invalid token format', 401)
    }

    // Verify user authentication with timeout
    const authPromise = supabaseClient.auth.getUser(token)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )
    
    const { data: { user }, error: authError } = await Promise.race([
      authPromise,
      timeoutPromise
    ]) as any

    if (authError || !user?.id) {
      await logAdminAction(supabaseClient, 'unknown', 'unauthorized_email_attempt', 
        { error: 'Invalid token', ip: req.headers.get('x-forwarded-for') }, req)
      return createErrorResponse('Authentication failed', 401)
    }

    // Check rate limiting
    if (!checkRateLimit(user.id)) {
      await logAdminAction(supabaseClient, user.id, 'rate_limit_exceeded', {}, req)
      return createErrorResponse('Too many requests', 429)
    }

    // Verify admin status using parameterized query
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminUser) {
      await logAdminAction(supabaseClient, user.id, 'unauthorized_email_attempt', 
        { reason: 'Not an admin user' }, req)
      return createErrorResponse('Access denied', 403)
    }

    // Parse and validate request body
    let requestBody
    try {
      const bodyText = await req.text()
      if (!bodyText || bodyText.length > 50000) {
        throw new Error('Invalid body size')
      }
      requestBody = JSON.parse(bodyText)
    } catch (error) {
      await logAdminAction(supabaseClient, user.id, 'invalid_request_body', {}, req)
      return createErrorResponse('Invalid request format', 400)
    }

    const { pillar, subject, content } = requestBody

    // Validate input with enhanced security
    const validationErrors = validateEmailInput(pillar, subject, content)
    if (validationErrors.length > 0) {
      await logAdminAction(supabaseClient, user.id, 'email_validation_failed', 
        { errors: validationErrors, pillar: sanitizeHtml(pillar) }, req)
      return createErrorResponse('Validation failed', 400)
    }

    // Get employees using parameterized query to prevent SQL injection
    const { data: employees, error: employeesError } = await supabaseClient
      .from('employees')
      .select('name, email')
      .eq('pillar', pillar)
      .limit(1000) // Prevent excessive data retrieval

    if (employeesError) {
      console.error('Database error:', employeesError)
      await logAdminAction(supabaseClient, user.id, 'email_database_error', 
        { pillar: sanitizeHtml(pillar) }, req)
      return createErrorResponse('Database error', 500)
    }

    if (!employees || employees.length === 0) {
      await logAdminAction(supabaseClient, user.id, 'email_no_recipients', 
        { pillar: sanitizeHtml(pillar) }, req)
      return createErrorResponse('No recipients found', 404)
    }

    // Limit number of recipients to prevent abuse
    if (employees.length > 500) {
      await logAdminAction(supabaseClient, user.id, 'email_too_many_recipients', 
        { pillar: sanitizeHtml(pillar), count: employees.length }, req)
      return createErrorResponse('Too many recipients', 400)
    }

    // Log the email send attempt
    await logAdminAction(supabaseClient, user.id, 'email_send_initiated', { 
      pillar: sanitizeHtml(pillar), 
      subject: sanitizeHtml(subject).substring(0, 100),
      recipientCount: employees.length 
    }, req)

    // Check if Gmail credentials are available
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    
    if (gmailUser && gmailPassword) {
      // Configure SMTP client
      await smtpClient.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465, // Use 465 for SSL/TLS
        username: gmailUser,
        password: gmailPassword,
      });

      // Send actual emails using Gmail SMTP
      const emailPromises = employees.map(async (employee) => {
        try {
          // Validate employee email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(employee.email)) {
            throw new Error('Invalid email format')
          }

          // Sanitize content for HTML email with strict filtering
          const sanitizedSubject = sanitizeHtml(subject)
          const sanitizedContent = sanitizeHtml(content)
            .replace(/\n/g, '<br>')
            .replace(/\r/g, '')
          const sanitizedName = sanitizeHtml(employee.name)
          
          await smtpClient.send({
            from: gmailUser,
            to: employee.email,
            subject: sanitizedSubject,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #d97706;">
                  <h2 style="color: #8B4513; margin: 0;">Message from Admin Portal</h2>
                </div>
                <div style="padding: 20px;">
                  <p>Dear ${sanitizedName},</p>
                  <div style="background-color: #FDF5E6; padding: 20px; border-left: 4px solid #D2B48C; margin: 20px 0; border-radius: 4px;">
                    ${sanitizedContent}
                  </div>
                  <p>Best regards,<br>Admin Portal Team</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                  This email was sent from the Corporate Communications Portal
                </div>
              </div>
            `,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #d97706;">
                  <h2 style="color: #8B4513; margin: 0;">Message from Admin Portal</h2>
                </div>
                <div style="padding: 20px;">
                  <p>Dear ${sanitizedName},</p>
                  <div style="background-color: #FDF5E6; padding: 20px; border-left: 4px solid #D2B48C; margin: 20px 0; border-radius: 4px;">
                    ${sanitizedContent}
                  </div>
                  <p>Best regards,<br>Admin Portal Team</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                  This email was sent from the Corporate Communications Portal
                </div>
              </div>
            `,
          });
          
          return { success: true, email: employee.email }
        } catch (error) {
          console.error(`Failed to send email to ${employee.email}:`, error.message)
          return { success: false, email: employee.email, error: 'Send failed' }
        }
      })
      
      const results = await Promise.all(emailPromises)
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      
      // Close SMTP connection
      await smtpClient.close();
      
      // Log the final result
      await logAdminAction(supabaseClient, user.id, 'email_send_completed', { 
        pillar: sanitizeHtml(pillar), 
        successCount, 
        failureCount,
        totalRecipients: employees.length
      }, req)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Emails sent successfully to ${successCount} employees`,
          recipients: successCount,
          failures: failureCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Fallback: Log email details (for testing without Gmail credentials)
      await logAdminAction(supabaseClient, user.id, 'email_send_simulated', { 
        pillar: sanitizeHtml(pillar), 
        recipientCount: employees.length,
        note: 'Gmail credentials not configured'
      }, req)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email simulated for ${employees.length} employees`,
          recipients: employees.length,
          note: 'Configure GMAIL_USER and GMAIL_APP_PASSWORD to send actual emails'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in send-email function:', error)
    
    // Return generic error message to prevent information disclosure
    return createErrorResponse('Internal server error', 500)
  }
})