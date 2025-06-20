
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield } from 'lucide-react';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const { signIn } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting - simple client-side check
    if (attemptCount >= 5) {
      setError('Too many failed attempts. Please wait before trying again.');
      return;
    }
    
    setLoading(true);
    setError('');

    // Input validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setAttemptCount(prev => prev + 1);
        
        // Sanitize error messages to prevent information disclosure
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else if (error.message.includes('Too many requests')) {
          setError('Too many sign-in attempts. Please wait before trying again.');
        } else {
          setError('Sign-in failed. Please check your credentials and try again.');
        }
      } else {
        // Reset attempt count on successful login
        setAttemptCount(0);
      }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      setError('An unexpected error occurred. Please try again.');
      setAttemptCount(prev => prev + 1);
    }
    
    setLoading(false);
  };

  const isRateLimited = attemptCount >= 5;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="h-6 w-6 text-amber-600" />
            <CardTitle className="text-2xl font-bold text-center">Secure Admin Portal</CardTitle>
          </div>
          <CardDescription className="text-center">
            Authorized personnel only - Sign in to access the communication system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                disabled={loading || isRateLimited}
                className="transition-colors"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || isRateLimited}
                className="transition-colors"
                autoComplete="current-password"
                minLength={6}
              />
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {isRateLimited && (
              <div className="text-amber-600 text-sm bg-amber-50 p-3 rounded-md border border-amber-200">
                Security measure activated. Please wait a few minutes before attempting to sign in again.
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" 
              disabled={loading || isRateLimited}
            >
              {loading ? 'Verifying Access...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-xs text-gray-500">
            This system is for authorized administrators only. 
            All access attempts are monitored and logged.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
