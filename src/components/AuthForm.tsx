import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { authRateLimiter, validatePassword, isValidEmail } from '@/utils/security';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced rate limiting
    const clientId = `${navigator.userAgent}_${window.location.hostname}`;
    if (authRateLimiter.isRateLimited(clientId, 5, 900000)) { // 15 minutes
      setError('Too many failed attempts. Please wait 15 minutes before trying again.');
      return;
    }
    
    setLoading(true);
    setError('');

    // Enhanced input validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements');
      setLoading(false);
      return;
    }

    // Additional security checks
    if (email.length > 254 || password.length > 128) {
      setError('Input too long');
      setLoading(false);
      return;
    }

    try {
      setAuthenticating(true);
      const { error } = await signIn(email.trim().toLowerCase(), password);
      
      if (error) {
        setAttemptCount(prev => prev + 1);
        setAuthenticating(false);
        
        // Generic error messages to prevent information disclosure
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else if (error.message.includes('Too many requests')) {
          setError('Too many sign-in attempts. Please wait before trying again.');
        } else if (error.message.includes('signup_disabled')) {
          setError('Account registration is currently disabled.');
        } else {
          setError('Sign-in failed. Please check your credentials and try again.');
        }
        
        // Log failed attempt for monitoring
        console.warn('Authentication failed:', {
          timestamp: new Date().toISOString(),
          email: email.substring(0, 3) + '***', // Partial email for logging
          userAgent: navigator.userAgent.substring(0, 100)
        });
      } else {
        // Reset attempt count on successful login
        setAttemptCount(0);
        authRateLimiter.resetAttempts(clientId);
        // Keep authenticating state true - the AuthContext will handle the transition
      }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      setError('An unexpected error occurred. Please try again.');
      setAttemptCount(prev => prev + 1);
      setAuthenticating(false);
    }
    
    setLoading(false);
  };

  const isRateLimited = attemptCount >= 5;

  // Show loading screen during authentication
  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-amber-200/30 to-orange-200/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-orange-200/20 to-yellow-200/20 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-yellow-200/25 to-amber-200/25 rounded-full blur-md animate-pulse delay-500"></div>
        </div>

        {/* Main Loading Container */}
        <div className="relative z-10 text-center max-w-md mx-auto px-8">
          {/* 3D Logo Container */}
          <div className="relative mb-8">
            {/* 3D Mail Icon with Floating Animation */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl transform rotate-12 animate-pulse shadow-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl transform -rotate-6 animate-pulse delay-300 shadow-xl"></div>
              <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <Shield className="w-12 h-12 text-white mx-auto animate-bounce" />
              </div>
            </div>

            {/* Floating Icons */}
            <div className="absolute -top-4 -left-8 animate-float">
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-3 rounded-full shadow-lg">
                <Shield className="w-6 h-6 text-amber-700" />
              </div>
            </div>
            <div className="absolute -top-2 -right-8 animate-float delay-1000">
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-3 rounded-full shadow-lg">
                <Shield className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-amber-900 mb-2 animate-fade-in">
            Authenticating...
          </h1>
          <p className="text-amber-700 mb-8 animate-fade-in delay-300">
            Verifying your credentials and loading dashboard
          </p>

          {/* Loading Spinner */}
          <div className="relative mb-6">
            <LoadingSpinner size="lg" className="mx-auto" />
          </div>

          {/* Loading Text */}
          <p className="text-amber-800 font-medium animate-pulse">
            Setting up your secure session...
          </p>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-amber-700 text-sm">
            <Shield className="w-4 h-4" />
            <span>Secure Authentication in Progress</span>
          </div>
        </div>

        {/* Particle Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/50 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

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
                maxLength={254}
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
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
                minLength={8}
                maxLength={128}
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
                Security measure activated. Please wait before attempting to sign in again.
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" 
              disabled={loading || isRateLimited}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Verifying Access...</span>
                </div>
              ) : (
                'Sign In'
              )}
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