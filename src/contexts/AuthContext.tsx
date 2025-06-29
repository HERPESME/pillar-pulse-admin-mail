import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, validateSession, secureSignOut } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Enhanced session validation
    const initializeAuth = async () => {
      try {
        const isValidSession = await validateSession();
        
        if (!isValidSession) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Auth initialization error:', error);
            setSession(null);
            setUser(null);
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener with enhanced security
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event);

        // Enhanced session validation on state change
        if (session) {
          const isValid = await validateSession();
          if (!isValid) {
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Security: Clear sensitive data on sign out
        if (event === 'SIGNED_OUT') {
          try {
            localStorage.removeItem('sb-auth-token');
            sessionStorage.clear();
          } catch {
            // Ignore storage errors
          }
        }
      }
    );

    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign in with security measures
  const signIn = async (email: string, password: string) => {
    try {
      // Input validation
      if (!email || !password) {
        return { error: { message: 'Email and password are required' } };
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Invalid email format' } };
      }

      // Length validation
      if (email.length > 254 || password.length > 128) {
        return { error: { message: 'Input too long' } };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Log failed attempt for monitoring (without sensitive data)
        console.warn('Sign in failed:', {
          timestamp: new Date().toISOString(),
          email: email.substring(0, 3) + '***',
          errorCode: error.message?.substring(0, 50)
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred during sign in' 
        } 
      };
    }
  };

  // Enhanced sign out with security cleanup
  const signOut = async () => {
    try {
      await secureSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force reload even if sign out fails
      window.location.reload();
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
  };

  // Show a beautiful loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-amber-700 font-medium">Verifying authentication...</p>
          <p className="text-amber-600 text-sm mt-2">Ensuring secure access...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};