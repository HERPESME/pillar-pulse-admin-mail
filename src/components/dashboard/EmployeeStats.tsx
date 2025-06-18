
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: number;
  pillar: string;
  level: string;
}

interface EmployeeStatsProps {
  employees: Employee[];
  pillars: string[];
}

const EmployeeStats = ({ employees, pillars }: EmployeeStatsProps) => {
  const getEmployeesByPillar = (pillar: string) => {
    return employees.filter(emp => emp.pillar === pillar);
  };

  return (
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
  );
};

export default EmployeeStats;
