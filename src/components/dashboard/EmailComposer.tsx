
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface EmailComposerProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (value: string) => void;
  onContentChange: (value: string) => void;
}

const EmailComposer = ({ subject, emailContent, onSubjectChange, onContentChange }: EmailComposerProps) => {
  return (
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
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full px-3 py-2 border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-amber-900 mb-2 block">Message</label>
          <Textarea
            placeholder="Enter your email content here..."
            value={emailContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[200px] resize-none border-amber-200 focus:ring-amber-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailComposer;
