/*
  # Remove admin system and simplify authentication

  1. Changes
    - Drop admin_users table and related policies
    - Update employees table policies to allow any authenticated user
    - Remove is_admin_user function
    
  2. Security
    - Enable RLS on employees table
    - Add policies for authenticated users to read/write employees
*/

-- Drop existing policies and function
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;

DROP FUNCTION IF EXISTS public.is_admin_user();

-- Drop admin_users table
DROP TABLE IF EXISTS public.admin_users;

-- Create new policies for employees table - allow any authenticated user
CREATE POLICY "Authenticated users can view employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON public.employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete employees"
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (true);