
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LogOut, Mail, Users, Send, Eye } from 'lucide-react';

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
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('pillar', { ascending: true });

      if (error) throw error;

      setEmployees(data || []);
      
      // Extract unique pillars
      const uniquePillars = [...new Set(data?.map(emp => emp.pillar) || [])];
      setPillars(uniquePillars);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employee data',
        variant: 'destructive',
      });
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

    setLoading(true);
    const pillarEmployees = getEmployeesByPillar(pillar);

    try {
      // Here you would integrate with your email service (Resend, EmailJS, etc.)
      // For now, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Success!',
        description: `Email sent to ${pillarEmployees.length} employees in ${pillar} pillar`,
      });

      console.log('Email content:', emailContent);
      console.log('Recipients:', pillarEmployees.map(emp => emp.email));
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send emails',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (pillar: string) => {
    setSelectedPillar(pillar);
    setPreviewMode(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Employee Email Portal</h1>
            </div>
            <Button variant="outline" onClick={signOut} className="flex items-center space-x-2">
              <LogOut size={16} />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Composition */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span>Compose Email</span>
                </CardTitle>
                <CardDescription>
                  Write your message and select a pillar to send to all employees in that group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your email content here..."
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </CardContent>
            </Card>

            {/* Pillar Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Send to Pillar</CardTitle>
                <CardDescription>
                  Click a pillar button to send the email to all employees in that group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pillars.map((pillar) => {
                    const employeeCount = getEmployeesByPillar(pillar).length;
                    return (
                      <div key={pillar} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-sm">
                            {pillar} ({employeeCount} employees)
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handlePreview(pillar)}
                            variant="outline"
                            size="sm"
                            className="flex-1 flex items-center space-x-2"
                          >
                            <Eye size={16} />
                            <span>Preview</span>
                          </Button>
                          <Button
                            onClick={() => handleSendEmail(pillar)}
                            disabled={loading || !emailContent.trim()}
                            className="flex-1 flex items-center space-x-2"
                          >
                            <Send size={16} />
                            <span>{loading ? 'Sending...' : 'Send'}</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview/Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Employee Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                    <div className="text-sm text-gray-600">Total Employees</div>
                  </div>
                  <div className="space-y-2">
                    {pillars.map((pillar) => (
                      <div key={pillar} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{pillar}</span>
                        <Badge variant="outline">{getEmployeesByPillar(pillar).length}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {previewMode && selectedPillar && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Preview</CardTitle>
                  <CardDescription>
                    Preview for {selectedPillar} pillar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Recipients ({getEmployeesByPillar(selectedPillar).length}):</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {getEmployeesByPillar(selectedPillar).map((emp) => (
                          <div key={emp.id} className="text-sm text-gray-600 flex justify-between">
                            <span>{emp.name}</span>
                            <span>{emp.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Email Content:</h4>
                      <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                        {emailContent || 'No content entered yet...'}
                      </div>
                    </div>
                    <Button
                      onClick={() => setPreviewMode(false)}
                      variant="outline"
                      size="sm"
                      className="w-full"
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
    </div>
  );
};

export default AdminDashboard;
