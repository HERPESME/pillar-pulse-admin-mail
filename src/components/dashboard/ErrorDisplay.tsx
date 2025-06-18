
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
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
  );
};

export default ErrorDisplay;
