
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON public.employees;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Create admin-only policies for employees table
CREATE POLICY "Only admins can read employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Only admins can insert employees"
  ON public.employees
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Only admins can update employees"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Only admins can delete employees"
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

-- Fix admin_users table policies to prevent recursion
DROP POLICY IF EXISTS "Allow self-read on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Allow users to read their own admin record (direct check)
CREATE POLICY "Users can read own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit logs"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());
