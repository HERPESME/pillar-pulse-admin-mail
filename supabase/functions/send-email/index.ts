
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { pillar, subject, content } = await req.json()

    // Get employees for the specified pillar
    const { data: employees, error: employeesError } = await supabaseClient
      .from('employees')
      .select('name, email')
      .eq('pillar', pillar)

    if (employeesError) {
      throw employeesError
    }

    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      // Send actual emails using Resend
      const emailPromises = employees.map(async (employee) => {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Company Admin <onboarding@resend.dev>',
              to: employee.email,
              subject: subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #8B4513;">Message from Company Administration</h2>
                  <p>Dear ${employee.name},</p>
                  <div style="background-color: #FDF5E6; padding: 20px; border-left: 4px solid #D2B48C; margin: 20px 0;">
                    ${content.replace(/\n/g, '<br>')}
                  </div>
                  <p>Best regards,<br>Company Administration</p>
                </div>
              `,
            }),
          })
          
          if (!response.ok) {
            throw new Error(`Failed to send email to ${employee.email}`)
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
      
      console.log(`Email sending completed: ${successCount} succeeded, ${failureCount} failed`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Emails sent successfully to ${successCount} employees in ${pillar} pillar`,
          recipients: successCount,
          failures: failureCount,
          details: results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Fallback: Log email details (for testing without Resend)
      console.log(`Would send email to ${employees.length} employees in ${pillar} pillar`)
      console.log('Subject:', subject)
      console.log('Content:', content)
      console.log('Recipients:', employees.map(emp => emp.email))

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
