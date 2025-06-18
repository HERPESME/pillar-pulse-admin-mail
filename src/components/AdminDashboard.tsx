
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LogOut, Mail, Users, Send, Eye, RefreshCw, AlertCircle } from 'lucide-react';

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

  const getEmployeesByPillar = (pillar: string) => {
    return employees.filter(emp => emp.pillar === pillar);
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
    const pillarEmployees = getEmployeesByPillar(pillar);

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
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-100 to-orange-100 shadow-lg border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-200 rounded-xl">
                <Mail className="h-8 w-8 text-amber-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-900">Corporate Communications</h1>
                <p className="text-sm text-amber-700">Employee Messaging Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={fetchEmployees}
                disabled={refreshing}
                className="flex items-center space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={signOut} 
                className="flex items-center space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle size={20} />
                <div>
                  <p className="font-medium">Database Connection Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <p className="text-sm text-red-700 mt-2">
                    Please check your database connection and ensure the employees table exists.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Composition */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="flex items-center space-x-2 text-amber-900">
                  <Send className="h-5 w-5" />
                  <span>Compose Email</span>
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Write your message and select a pillar to send to all employees in that group
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label className="text-sm font-medium text-amber-900 mb-2 block">Subject</label>
                  <input
                    type="text"
                    placeholder="Enter email subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-900 mb-2 block">Message</label>
                  <Textarea
                    placeholder="Enter your email content here..."
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="min-h-[200px] resize-none border-amber-200 focus:ring-amber-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Pillar Buttons */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="text-amber-900">Send to Department</CardTitle>
                <CardDescription className="text-amber-700">
                  Click a department button to send the email to all employees in that group. 
                  Departments are automatically detected from the employee database.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600">Unable to load departments</p>
                    <p className="text-sm text-red-500 mt-2">Fix the database connection to see department options</p>
                  </div>
                ) : pillars.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                    <p className="text-amber-600">No departments found in the database</p>
                    <p className="text-sm text-amber-500 mt-2">Add employees to see department options</p>
                    <Button 
                      onClick={fetchEmployees} 
                      variant="outline" 
                      className="mt-4 border-amber-300 text-amber-800 hover:bg-amber-100"
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh Data
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pillars.map((pillar) => {
                      const employeeCount = getEmployeesByPillar(pillar).length;
                      const isLoading = loadingPillars.has(pillar);
                      return (
                        <div key={pillar} className="space-y-3 p-4 bg-gradient-to-br from-amber-25 to-orange-25 rounded-lg border border-amber-100">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-sm bg-amber-200 text-amber-800 hover:bg-amber-300">
                              {pillar} ({employeeCount} employees)
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handlePreview(pillar)}
                              variant="outline"
                              size="sm"
                              className="flex-1 flex items-center space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100 hover:scale-105 transition-all duration-200"
                              disabled={isLoading}
                            >
                              <Eye size={16} />
                              <span>Preview</span>
                            </Button>
                            <Button
                              onClick={() => handleSendEmail(pillar)}
                              disabled={isLoading || !emailContent.trim() || !subject.trim()}
                              className="flex-1 flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white hover:scale-105 transition-all duration-200 shadow-lg"
                              size="sm"
                            >
                              <Send size={16} className={isLoading ? 'animate-spin' : ''} />
                              <span>{isLoading ? 'Sending...' : 'Send'}</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview/Stats Sidebar */}
          <div className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="flex items-center space-x-2 text-amber-900">
                  <Users className="h-5 w-5" />
                  <span>Employee Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                    <div className="text-3xl font-bold text-amber-800">{employees.length}</div>
                    <div className="text-sm text-amber-700">Total Employees</div>
                  </div>
                  <div className="space-y-3">
                    {pillars.map((pillar) => (
                      <div key={pillar} className="flex justify-between items-center p-3 bg-amber-25 rounded-lg border border-amber-100">
                        <span className="text-sm font-medium text-amber-900">{pillar}</span>
                        <Badge variant="outline" className="border-amber-300 text-amber-800">
                          {getEmployeesByPillar(pillar).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {previewMode && selectedPillar && (
              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardTitle className="text-amber-900">Email Preview</CardTitle>
                  <CardDescription className="text-amber-700">
                    Preview for {selectedPillar} department
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-amber-900">Subject:</h4>
                      <div className="p-3 bg-amber-50 rounded-md text-sm border border-amber-200">
                        {subject || 'No subject entered yet...'}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-amber-900">Recipients ({getEmployeesByPillar(selectedPillar).length}):</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {getEmployeesByPillar(selectedPillar).map((emp) => (
                          <div key={emp.id} className="text-sm text-amber-700 flex justify-between p-2 bg-amber-50 rounded border border-amber-100">
                            <span>{emp.name}</span>
                            <span>{emp.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-amber-900">Email Content:</h4>
                      <div className="p-3 bg-amber-50 rounded-md text-sm whitespace-pre-wrap border border-amber-200">
                        {emailContent || 'No content entered yet...'}
                      </div>
                    </div>
                    <Button
                      onClick={() => setPreviewMode(false)}
                      variant="outline"
                      size="sm"
                      className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Close Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-100 to-orange-100 border-t border-amber-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-amber-800 text-sm">
              © 2024 Corporate Communications Portal. Manage your team communications efficiently.
            </p>
            <p className="text-amber-600 text-xs mt-2">
              Secure • Professional • Reliable
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
