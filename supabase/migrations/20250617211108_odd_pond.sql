/*
  # Fix employee data access

  1. Security Updates
    - Ensure RLS is properly configured for employees table
    - Allow authenticated users to read employee data
    - Fix any policy conflicts

  2. Database Verification
    - Verify table structure
    - Ensure proper permissions
*/

-- First, let's make sure RLS is enabled on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON public.employees;

-- Drop any old admin policies that might still exist
DROP POLICY IF EXISTS "Admins can view employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Only admin users can access employees" ON public.employees;

-- Create simple, clear policies for authenticated users
CREATE POLICY "Allow authenticated users to read employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert employees"
  ON public.employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employees"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete employees"
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure the employees table has the correct structure
DO $$
BEGIN
  -- Check if columns exist and add them if they don't
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'name') THEN
    ALTER TABLE employees ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'email') THEN
    ALTER TABLE employees ADD COLUMN email text UNIQUE NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employee_id') THEN
    ALTER TABLE employees ADD COLUMN employee_id integer UNIQUE NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pillar') THEN
    ALTER TABLE employees ADD COLUMN pillar text NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'level') THEN
    ALTER TABLE employees ADD COLUMN level text NOT NULL DEFAULT '';
  END IF;
END $$;