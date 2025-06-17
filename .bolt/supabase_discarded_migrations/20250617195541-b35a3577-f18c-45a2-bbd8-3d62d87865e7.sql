
-- Enable RLS on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_users table  
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Policy for admin_users table - only admins can view admin records
CREATE POLICY "Admins can view admin users" ON public.admin_users
  FOR SELECT USING (public.is_admin_user());

-- Policy for employees table - only admins can view employees
CREATE POLICY "Admins can view employees" ON public.employees
  FOR SELECT USING (public.is_admin_user());

-- Policy for employees table - only admins can insert employees
CREATE POLICY "Admins can insert employees" ON public.employees
  FOR INSERT WITH CHECK (public.is_admin_user());

-- Policy for employees table - only admins can update employees
CREATE POLICY "Admins can update employees" ON public.employees
  FOR UPDATE USING (public.is_admin_user());

-- Policy for employees table - only admins can delete employees
CREATE POLICY "Admins can delete employees" ON public.employees
  FOR DELETE USING (public.is_admin_user());
