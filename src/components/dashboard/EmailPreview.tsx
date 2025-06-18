
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: number;
  pillar: string;
  level: string;
}

interface EmailPreviewProps {
  selectedPillar: string;
  subject: string;
  emailContent: string;
  employees: Employee[];
  onClose: () => void;
}

const EmailPreview = ({ selectedPillar, subject, emailContent, employees, onClose }: EmailPreviewProps) => {
  const getEmployeesByPillar = (pillar: string) => {
    return employees.filter(emp => emp.pillar === pillar);
  };

  return (
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
            onClick={onClose}
            variant="outline"
            size="sm"
            className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            Close Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailPreview;
