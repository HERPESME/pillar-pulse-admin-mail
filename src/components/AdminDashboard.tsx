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
  const { signOut } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pillars, setPillars] = useState<string[]>([]);
  const [emailContent, setEmailContent] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [loadingPillars, setLoadingPillars] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      console.log('Fetching employees...');
      
      const result = await safeSupabaseCall(() =>
        supabase
          .from('employees')
          .select('*')
          .order('pillar', { ascending: true })
          .limit(1000) // Prevent excessive data retrieval
      );

      console.log('Supabase response:', result);

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw new Error(result.error.message || 'Database error');
      }

      const data = result.data || [];
      
      // Validate and sanitize employee data
      const validatedEmployees = data.filter(emp => {
        return emp.id && 
               emp.name && 
               emp.email && 
               emp.pillar && 
               emp.level &&
               validatePillarName(emp.pillar);
      }).map(emp => ({
        ...emp,
        name: sanitizeHtml(emp.name),
        pillar: sanitizeHtml(emp.pillar),
        level: sanitizeHtml(emp.level)
      }));

      setEmployees(validatedEmployees);
      
      // Extract unique pillars dynamically with validation
      const uniquePillars = [...new Set(validatedEmployees.map(emp => emp.pillar))]
        .filter(pillar => validatePillarName(pillar));
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