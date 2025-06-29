import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield } from 'lucide-react';
import { validateEmailContent } from '@/utils/security';

interface EmailComposerProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (subject: string) => void;
  onContentChange: (content: string) => void;
}

const EmailComposer = ({ subject, emailContent, onSubjectChange, onContentChange }: EmailComposerProps) => {
  const validationErrors = validateEmailContent(subject, emailContent);
  const hasErrors = validationErrors.length > 0;
  
  // Handle input changes with sanitization
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Basic sanitization for display, full sanitization happens on submit
    const sanitized = value.replace(/[<>]/g, '');
    onSubjectChange(sanitized);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Basic sanitization for display, full sanitization happens on submit
    const sanitized = value.replace(/[<>]/g, '');
    onContentChange(sanitized);
  };
  
  return (
    <Card className="border-amber-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-amber-700" />
          <CardTitle className="text-amber-900">Compose Message</CardTitle>
          <Shield className="h-4 w-4 text-green-600" />
        </div>
        <CardDescription className="text-amber-700">
          Create your message to send to department employees. All content is automatically sanitized for security.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-medium">
            Email Subject
          </Label>
          <Input
            id="subject"
            type="text"
            placeholder="Enter email subject..."
            value={subject}
            onChange={handleSubjectChange}
            className="w-full"
            maxLength={200}
            autoComplete="off"
            spellCheck={true}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subject line for your communication</span>
            <span className={subject.length > 180 ? 'text-amber-600 font-medium' : ''}>
              {subject.length}/200
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium">
            Message Content
          </Label>
          <Textarea
            id="content"
            placeholder="Enter your message content here..."
            value={emailContent}
            onChange={handleContentChange}
            className="min-h-32 w-full resize-none"
            maxLength={10000}
            autoComplete="off"
            spellCheck={true}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Your message will be automatically formatted for email delivery</span>
            <span className={emailContent.length > 9000 ? 'text-amber-600 font-medium' : ''}>
              {emailContent.length}/10,000
            </span>
          </div>
        </div>

        {hasErrors && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-600">Validation Issues:</div>
            {validationErrors.map((error, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {error}
              </Badge>
            ))}
          </div>
        )}

        {!hasErrors && subject && emailContent && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            ✓ Message ready to send
          </Badge>
        )}
        
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="flex items-center space-x-1 mb-1">
            <Shield className="w-3 h-3 text-green-600" />
            <strong>Security Notice:</strong>
          </div>
          <p>All email content is automatically sanitized to prevent security vulnerabilities. 
          HTML tags and potentially dangerous content are filtered before sending. 
          Your input is validated in real-time for safety.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailComposer;