
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from './dashboard/Header';
import EmailComposer from './dashboard/EmailComposer';
import PillarGrid from './dashboard/PillarGrid';
import EmployeeStats from './dashboard/EmployeeStats';
import EmailPreview from './dashboard/EmailPreview';
import Footer from './dashboard/Footer';
import ErrorDisplay from './dashboard/ErrorDisplay';

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
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('pillar', { ascending: true });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setEmployees(data || []);
      
      // Extract unique pillars dynamically
      const uniquePillars = [...new Set(data?.map(emp => emp.pillar) || [])];
      setPillars(uniquePillars);
      
      toast({
        title: 'Success',
        description: `Loaded ${data?.length || 0} employees across ${uniquePillars.length} pillars`,
      });
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      const errorMessage = error?.message || 'Failed to fetch employee data';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendEmail = async (pillar: string) => {
    if (!emailContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter email content before sending',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'Error', 
        description: 'Please enter email subject before sending',
        variant: 'destructive',
      });
      return;
    }

    // Add this pillar to loading state
    setLoadingPillars(prev => new Set(prev).add(pillar));
    const pillarEmployees = employees.filter(emp => emp.pillar === pillar);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          pillar,
          subject,
          content: emailContent
        }
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: data.message || `Email sent to ${pillarEmployees.length} employees in ${pillar} pillar`,
      });

      console.log('Email sent successfully:', data);
      
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send emails',
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
    setSelectedPillar(pillar);
    setPreviewMode(true);
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
              onSubjectChange={setSubject}
              onContentChange={setEmailContent}
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
