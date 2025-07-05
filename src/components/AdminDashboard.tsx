import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, safeSupabaseCall } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from './dashboard/Header';
import EmailComposer from './dashboard/EmailComposer';
import PillarGrid from './dashboard/PillarGrid';
import EmployeeStats from './dashboard/EmployeeStats';
import EmailPreview from './dashboard/EmailPreview';
import Footer from './dashboard/Footer';
import ErrorDisplay from './dashboard/ErrorDisplay';
import { sanitizeHtml, validateEmailContent, validatePillarName } from '@/utils/security';

interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: number;
  pillar: string;
  level: string;
}

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pillars, setPillars] = useState<string[]>([]);
  const [emailContent, setEmailContent] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [loadingPillars, setLoadingPillars] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_admin_user');
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data === true);
      
      if (data !== true) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges to access this dashboard.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      setIsAdmin(false);
    }
  };

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-700 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-6">You don't have admin privileges to access this dashboard.</p>
          <button
            onClick={signOut}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const fetchEmployees = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      console.log('Fetching employees...');
      
      const result = await safeSupabaseCall(async () => {
        const query = supabase
          .from('employees')
          .select('*')
          .order('pillar', { ascending: true })
          .limit(1000);
        
        return await query;
      });

      console.log('Supabase response:', result);

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw new Error(result.error.message || 'Database error');
      }

      const data = result.data || [];
      
      // Validate and sanitize employee data
      const validatedEmployees: Employee[] = data
        .filter((emp: any) => {
          return emp.id && 
                 emp.name && 
                 emp.email && 
                 emp.pillar && 
                 emp.level &&
                 validatePillarName(emp.pillar);
        })
        .map((emp: any) => ({
          id: emp.id,
          name: sanitizeHtml(emp.name),
          email: emp.email,
          employee_id: emp.employee_id,
          pillar: sanitizeHtml(emp.pillar),
          level: sanitizeHtml(emp.level)
        }));

      setEmployees(validatedEmployees);
      
      // Extract unique pillars dynamically with validation
      const uniquePillars = [...new Set(validatedEmployees.map((emp: Employee) => emp.pillar))]
        .filter((pillar: string) => validatePillarName(pillar));
      setPillars(uniquePillars);
      
      toast({
        title: 'Success',
        description: `Loaded ${validatedEmployees.length} employees across ${uniquePillars.length} pillars`,
      });
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      const errorMessage = error?.message || 'Failed to fetch employee data';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: 'Unable to load employee data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendEmail = async (pillar: string) => {
    // Enhanced validation
    const validationErrors = validateEmailContent(subject, emailContent);
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors[0],
        variant: 'destructive',
      });
      return;
    }

    if (!validatePillarName(pillar)) {
      toast({
        title: 'Error',
        description: 'Invalid pillar selection',
        variant: 'destructive',
      });
      return;
    }

    // Add this pillar to loading state
    setLoadingPillars(prev => new Set(prev).add(pillar));
    const pillarEmployees = employees.filter(emp => emp.pillar === pillar);

    if (pillarEmployees.length === 0) {
      toast({
        title: 'Error',
        description: 'No employees found in selected pillar',
        variant: 'destructive',
      });
      setLoadingPillars(prev => {
        const newSet = new Set(prev);
        newSet.delete(pillar);
        return newSet;
      });
      return;
    }

    try {
      const result = await safeSupabaseCall(() =>
        supabase.functions.invoke('send-email', {
          body: {
            pillar: sanitizeHtml(pillar),
            subject: sanitizeHtml(subject),
            content: sanitizeHtml(emailContent)
          }
        })
      );

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send emails');
      }

      const data = result.data;
      toast({
        title: 'Success!',
        description: data?.message || `Email sent to ${pillarEmployees.length} employees in ${pillar} pillar`,
      });

      console.log('Email sent successfully:', data);
      
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send emails. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Remove this pillar from loading state
      setLoadingPillars(prev => {
        const newSet = new Set(prev);
        newSet.delete(pillar);
        return newSet;
      });
    }
  };

  const handlePreview = (pillar: string) => {
    if (!validatePillarName(pillar)) {
      toast({
        title: 'Error',
        description: 'Invalid pillar selection',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedPillar(pillar);
    setPreviewMode(true);
  };

  // Enhanced input handlers with sanitization
  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
  };

  const handleContentChange = (newContent: string) => {
    setEmailContent(newContent);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header 
        onSignOut={signOut}
        onRefresh={fetchEmployees}
        refreshing={refreshing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorDisplay error={error} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Composition */}
          <div className="lg:col-span-2 space-y-6">
            <EmailComposer
              subject={subject}
              emailContent={emailContent}
              onSubjectChange={handleSubjectChange}
              onContentChange={handleContentChange}
            />

            <PillarGrid
              pillars={pillars}
              employees={employees}
              loadingPillars={loadingPillars}
              emailContent={emailContent}
              subject={subject}
              error={error}
              refreshing={refreshing}
              onSendEmail={handleSendEmail}
              onPreview={handlePreview}
              onRefresh={fetchEmployees}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EmployeeStats employees={employees} pillars={pillars} />

            {previewMode && selectedPillar && (
              <EmailPreview
                selectedPillar={selectedPillar}
                subject={subject}
                emailContent={emailContent}
                employees={employees}
                onClose={() => setPreviewMode(false)}
              />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
