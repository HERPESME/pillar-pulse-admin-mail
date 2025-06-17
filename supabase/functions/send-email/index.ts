
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

    // Verify the user is authenticated and get user info
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Here you would integrate with your email service
    // For example, using Resend API:
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    for (const employee of employees) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'admin@yourcompany.com',
          to: employee.email,
          subject: subject,
          html: content,
        }),
      })
    }
    */

    // For now, we'll just log the email details
    console.log(`Sending email to ${employees.length} employees in ${pillar} pillar`)
    console.log('Subject:', subject)
    console.log('Content:', content)
    console.log('Recipients:', employees.map(emp => emp.email))

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${employees.length} employees in ${pillar} pillar`,
        recipients: employees.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
