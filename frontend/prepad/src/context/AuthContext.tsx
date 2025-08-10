'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import Cookies from 'js-cookie';

type User = {
  id: number;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasDataProcessingConsent: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  setDataProcessingConsent: (consent: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDataProcessingConsent, setHasDataProcessingConsent] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();


  // Check for existing session on component mount (JWT or NextAuth)
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    // Check for NextAuth session first
    if (session?.user) {
      // Generate a proper JWT token for NextAuth users for API consistency
      const generateTokenForNextAuthUser = async () => {
        try {
          const response = await fetch('/api/auth/nextauth-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: Number(session.user.id),
              email: session.user.email,
              name: session.user.name
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser({
              id: Number(session.user.id),
              email: session.user.email || '',
              name: session.user.name || '',
            });
            setToken(data.token);
          } else {
            // Fallback to nextauth placeholder if token generation fails
            setUser({
              id: Number(session.user.id),
              email: session.user.email || '',
              name: session.user.name || '',
            });
            setToken('nextauth');
          }
        } catch (error) {
          console.log('Failed to generate JWT token for NextAuth user:', error);
          // Fallback to nextauth placeholder
          setUser({
            id: Number(session.user.id),
            email: session.user.email || '',
            name: session.user.name || '',
          });
          setToken('nextauth');
        }
        setIsLoading(false);
      };

      generateTokenForNextAuthUser();
      return;
    }

    // Fallback to JWT token from cookies
    const storedToken = Cookies.get('auth_token');
    const storedUser = Cookies.get('user') ? JSON.parse(Cookies.get('user') || '{}') : null;
    const storedConsent = Cookies.get('data_processing_consent') === 'true';
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    
    setHasDataProcessingConsent(storedConsent);
    
    // Add a small delay to ensure session is fully loaded
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, [session, status]);

  // Signup function
  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to signup');
      }
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      
      // Store in cookies
      Cookies.set('auth_token', data.token, { 
         expires: 1,
         // secure: true,         // Only transmit over HTTPS
         sameSite: 'strict',   // Prevent CSRF attacks
         httpOnly: true,       // Not accessible via JavaScript (requires server-side implementation)
         path: '/'             // Limit cookie to specific path
       });
       
       Cookies.set('user', JSON.stringify(data.user), { 
         expires: 1,
        // secure: true,
         sameSite: 'strict',
         path: '/'
       });
      
      // Direct user to dashboard - profile will be auto-created
      router.push('/dashboard');
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      
      // Store in cookies
      Cookies.set('auth_token', data.token, { expires: 1 }); // 1 day
      Cookies.set('user', JSON.stringify(data.user), { expires: 1 });
      
      // Direct all login users to dashboard
      router.push('/dashboard');
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function - redirect to dashboard to check profile
  const loginWithGoogle = async () => {
    try {
      await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  // Set data processing consent
  const setDataProcessingConsent = (consent: boolean) => {
    setHasDataProcessingConsent(consent);
    if (consent) {
      Cookies.set('data_processing_consent', 'true', { expires: 365 }); // 1 year
    } else {
      Cookies.remove('data_processing_consent');
    }
  };

  // Enhanced logout function for both auth methods
  const logout = async () => {
    // Clear state
    setUser(null);
    setToken(null);
    setHasDataProcessingConsent(false);
    
    // Clear JWT cookies
    Cookies.remove('auth_token');
    Cookies.remove('user');
    Cookies.remove('data_processing_consent');
    
    // Sign out from NextAuth if session exists
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      // Redirect to home page for JWT logout
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      hasDataProcessingConsent, 
      login, 
      signup, 
      loginWithGoogle, 
      logout, 
      setDataProcessingConsent 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}