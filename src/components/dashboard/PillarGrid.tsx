
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, RefreshCw, AlertCircle, Eye, Send } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: number;
  pillar: string;
  level: string;
}

interface PillarGridProps {
  pillars: string[];
  employees: Employee[];
  loadingPillars: Set<string>;
  emailContent: string;
  subject: string;
  error: string | null;
  refreshing: boolean;
  onSendEmail: (pillar: string) => void;
  onPreview: (pillar: string) => void;
  onRefresh: () => void;
}

const PillarGrid = ({ 
  pillars, 
  employees, 
  loadingPillars, 
  emailContent, 
  subject, 
  error, 
  refreshing,
  onSendEmail, 
  onPreview, 
  onRefresh 
}: PillarGridProps) => {
  const getEmployeesByPillar = (pillar: string) => {
    return employees.filter(emp => emp.pillar === pillar);
  };

  return (
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
              onClick={onRefresh} 
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
                      onClick={() => onPreview(pillar)}
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100 hover:scale-105 transition-all duration-200"
                      disabled={isLoading}
                    >
                      <Eye size={16} />
                      <span>Preview</span>
                    </Button>
                    <Button
                      onClick={() => onSendEmail(pillar)}
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
  );
};

export default PillarGrid;
