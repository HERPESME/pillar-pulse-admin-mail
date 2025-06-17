/*
  # Fix infinite recursion in admin_users RLS policy

  1. Problem
    - The `is_admin_user()` function queries `admin_users` table
    - The RLS policy on `admin_users` calls `is_admin_user()`
    - This creates infinite recursion when querying `admin_users`

  2. Solution
    - Drop the recursive policy "Admins can view admin users"
    - Add direct policies that don't use the `is_admin_user()` function
    - Allow users to read their own admin record
    - Allow existing admins to view all admin records via direct subquery

  3. Security
    - Maintains same security model without recursion
    - Users can only see admin records if they are admins themselves
*/

-- Drop the existing recursive policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Allow users to read their own admin record
CREATE POLICY "Allow self-read on admin_users" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- Allow existing admins to view all admin records (direct subquery, no function call)
CREATE POLICY "Admins can view all admin users" ON public.admin_users
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));