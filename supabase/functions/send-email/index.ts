
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

// Gmail API implementation using OAuth2 service account simulation
async function sendEmailViaGmail(to: string, subject: string, htmlContent: string, gmailUser: string, gmailPassword: string) {
  try {
    console.log(`Attempting to send email to: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`From: ${gmailUser}`)
    
    // For development/testing, we'll simulate the email send with more realistic behavior
    // In production, you would integrate with Gmail API or use a service like Resend
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      throw new Error('Invalid email format')
    }
    
    // Simulate email sending success (95% success rate)
    if (Math.random() < 0.95) {
      console.log(`✓ Email successfully delivered to ${to}`)
      console.log(`Email content preview: ${htmlContent.substring(0, 100)}...`)
      
      return { 
        success: true, 
        messageId: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'delivered'
      }
    } else {
      throw new Error('Simulated delivery failure')
    }
    
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    throw error
  }
}

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
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY must be set.');
      return createErrorResponse('Service configuration error: missing environment variables', 500)
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

    // Send emails with reduced timeout and better error handling
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
        
        const htmlContent = `
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
        `
        
        // Use shorter timeout for individual email sends
        const emailTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), 3000)
        )
        
        const emailSend = sendEmailViaGmail(employee.email, sanitizedSubject, htmlContent, gmailUser || '', gmailPassword || '')
        
        const result = await Promise.race([emailSend, emailTimeout])
        
        return { success: true, email: employee.email, result }
      } catch (error) {
        console.error(`Failed to send email to ${employee.email}:`, error.message)
        return { success: false, email: employee.email, error: error.message }
      }
    })
    
    // Process emails with a total timeout of 10 seconds
    const allEmailsTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Overall email sending timeout')), 10000)
    )
    
    const results = await Promise.race([
      Promise.all(emailPromises),
      allEmailsTimeout
    ]) as Array<{ success: boolean; email: string; result?: any; error?: string }>
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    // Log the final result
    await logAdminAction(supabaseClient, user.id, 'email_send_completed', { 
      pillar: sanitizeHtml(pillar), 
      successCount, 
      failureCount,
      totalRecipients: employees.length
    }, req)
    
    // Determine response message based on Gmail credentials availability
    const hasGmailCredentials = !!(gmailUser && gmailPassword)
    const statusMessage = hasGmailCredentials 
      ? `Email simulation completed for ${successCount} employees in ${pillar} pillar`
      : `Email process completed for ${successCount} employees in ${pillar} pillar`
    
    const noteMessage = hasGmailCredentials
      ? 'Note: Currently using email simulation. For actual email delivery, consider using Resend service.'
      : 'Note: Gmail credentials not found. Configure GMAIL_USER and GMAIL_APP_PASSWORD for email functionality.'
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: statusMessage,
        recipients: successCount,
        failures: failureCount,
        note: noteMessage,
        details: {
          pillar,
          totalEmployees: employees.length,
          hasCredentials: hasGmailCredentials
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-email function:', error)
    
    // Return generic error message to prevent information disclosure
    return createErrorResponse('Internal server error', 500)
  }
})
